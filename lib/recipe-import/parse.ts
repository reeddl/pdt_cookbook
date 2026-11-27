import { parse, type HTMLElement } from "node-html-parser";

/**
 * Pulls a recipe out of a web page's HTML without any AI: it reads the
 * schema.org Recipe data that recipe sites publish for search engines
 * (JSON-LD first, then microdata), and formats it the way this site stores
 * recipes. Pure function, no network, so it can be tested on saved pages.
 */

export interface ImportedRecipe {
  title: string;
  /** One ingredient per line, like the submit form expects. */
  ingredients: string;
  /** Numbered steps, one per line, with section names on their own line. */
  instructions: string;
  /** The site's own category (e.g. "Dessert"), when it gives one. */
  category?: string;
}

export type ParseResult =
  | { ok: true; recipe: ImportedRecipe }
  | { ok: false; reason: "no-recipe" | "incomplete" };

type Json = unknown;

export function parseRecipeHtml(html: string): ParseResult {
  const root = parse(html, { blockTextElements: { script: true, style: false, pre: true } });

  const candidates = [...findJsonLdRecipes(root), ...findMicrodataRecipes(root)];
  if (candidates.length === 0) return { ok: false, reason: "no-recipe" };

  // Prefer the first candidate that has both parts; otherwise fill gaps from others.
  const complete = candidates.find((c) => c.ingredients && c.instructions);
  const merged: Partial<ImportedRecipe> = complete ?? {};
  for (const c of candidates) {
    merged.title ||= c.title;
    merged.ingredients ||= c.ingredients;
    merged.instructions ||= c.instructions;
    merged.category ||= c.category;
  }

  if (!merged.ingredients || !merged.instructions) return { ok: false, reason: "incomplete" };

  return {
    ok: true,
    recipe: {
      title: merged.title || pageTitle(root) || "",
      ingredients: merged.ingredients,
      instructions: merged.instructions,
      ...(merged.category ? { category: merged.category } : {}),
    },
  };
}

// ---------------------------------------------------------------------------
// JSON-LD

function findJsonLdRecipes(root: HTMLElement): Partial<ImportedRecipe>[] {
  const out: Partial<ImportedRecipe>[] = [];
  for (const script of root.querySelectorAll("script")) {
    const type = (script.getAttribute("type") ?? "").toLowerCase();
    if (!type.includes("ld+json")) continue;
    const data = parseJsonLoose(script.rawText);
    if (data === undefined) continue;
    for (const node of collectRecipeNodes(data)) {
      out.push(fromJsonLd(node));
    }
  }
  return out;
}

function parseJsonLoose(text: string): Json | undefined {
  const trimmed = text.trim().replace(/^<!--/, "").replace(/-->$/, "").trim();
  if (!trimmed) return undefined;
  try {
    return JSON.parse(trimmed);
  } catch {
    // Some sites leave raw newlines/tabs inside strings, which strict JSON rejects.
    try {
      return JSON.parse(escapeControlCharsInStrings(trimmed));
    } catch {
      return undefined;
    }
  }
}

/** Escapes raw control characters that appear inside JSON string literals. */
function escapeControlCharsInStrings(text: string): string {
  let out = "";
  let inString = false;
  let escaped = false;
  for (const ch of text) {
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      else if (ch === "\n") {
        out += "\\n";
        continue;
      } else if (ch < " ") {
        out += " ";
        continue;
      }
    } else if (ch === '"') {
      inString = true;
    }
    out += ch;
  }
  return out;
}

function isRecipeType(t: Json): boolean {
  const types = Array.isArray(t) ? t : [t];
  return types.some((x) => typeof x === "string" && /(^|[/:])Recipe$/i.test(x));
}

/** Walks @graph, arrays and nested objects looking for Recipe nodes. */
function collectRecipeNodes(data: Json, depth = 0, found: Record<string, Json>[] = []) {
  if (depth > 6 || data === null || typeof data !== "object") return found;
  if (Array.isArray(data)) {
    for (const item of data) collectRecipeNodes(item, depth + 1, found);
    return found;
  }
  const obj = data as Record<string, Json>;
  if (isRecipeType(obj["@type"])) {
    found.push(obj);
    return found;
  }
  for (const key of ["@graph", "mainEntity", "mainEntityOfPage", "itemListElement", "item"]) {
    if (key in obj) collectRecipeNodes(obj[key], depth + 1, found);
  }
  return found;
}

function fromJsonLd(node: Record<string, Json>): Partial<ImportedRecipe> {
  const ingredients = toList(node.recipeIngredient ?? node.ingredients)
    .map(cleanLine)
    .filter(Boolean);

  const steps = instructionBlocks(node.recipeInstructions);

  const category = toList(node.recipeCategory).map(cleanLine).find(Boolean);

  return {
    title: typeof node.name === "string" ? cleanLine(node.name) : undefined,
    ingredients: ingredients.length ? dedupeAdjacent(ingredients).join("\n") : undefined,
    instructions: steps.length ? formatInstructions(steps) : undefined,
    category: category ? category.slice(0, 60) : undefined,
  };
}

/** A block is either a named section with steps, or a flat list of steps (name = undefined). */
interface StepBlock {
  name?: string;
  steps: string[];
}

function instructionBlocks(value: Json): StepBlock[] {
  const blocks: StepBlock[] = [];
  const loose: string[] = [];

  const flushLoose = () => {
    if (loose.length) blocks.push({ steps: loose.splice(0) });
  };

  const visit = (v: Json, depth: number) => {
    if (depth > 5 || v == null) return;
    if (typeof v === "string") {
      loose.push(...splitStepText(v));
      return;
    }
    if (Array.isArray(v)) {
      for (const item of v) visit(item, depth + 1);
      return;
    }
    if (typeof v !== "object") return;
    const obj = v as Record<string, Json>;
    const types = Array.isArray(obj["@type"]) ? obj["@type"] : [obj["@type"]];

    if (types.includes("HowToSection") || ("itemListElement" in obj && !("text" in obj))) {
      flushLoose();
      const inner: string[] = [];
      collectStepTexts(obj.itemListElement, inner, depth + 1);
      if (inner.length) {
        const name = typeof obj.name === "string" ? cleanLine(obj.name) : undefined;
        blocks.push({ name: name || undefined, steps: inner });
      }
      return;
    }
    collectStepTexts(obj, loose, depth + 1);
  };

  visit(value, 0);
  flushLoose();
  return blocks.filter((b) => b.steps.length);
}

function collectStepTexts(v: Json, into: string[], depth: number) {
  if (depth > 6 || v == null) return;
  if (typeof v === "string") {
    into.push(...splitStepText(v));
  } else if (Array.isArray(v)) {
    for (const item of v) collectStepTexts(item, into, depth + 1);
  } else if (typeof v === "object") {
    const obj = v as Record<string, Json>;
    if (typeof obj.text === "string" && obj.text.trim()) {
      into.push(...splitStepText(obj.text));
    } else if (obj.itemListElement) {
      collectStepTexts(obj.itemListElement, into, depth + 1);
    } else if (typeof obj.name === "string") {
      into.push(...splitStepText(obj.name));
    }
  }
}

/** A step string may hold HTML or several lines; split it into clean steps. */
function splitStepText(raw: string): string[] {
  return htmlToText(raw)
    .split(/\n+/)
    .map(cleanStep)
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// Microdata fallback (older sites: itemprop="recipeIngredient" etc.)

function findMicrodataRecipes(root: HTMLElement): Partial<ImportedRecipe>[] {
  const out: Partial<ImportedRecipe>[] = [];
  for (const scope of root.querySelectorAll("[itemscope]")) {
    const type = scope.getAttribute("itemtype") ?? "";
    if (!/schema\.org\/Recipe\b/i.test(type)) continue;

    const ingredients = scope
      .querySelectorAll('[itemprop~="recipeIngredient"], [itemprop~="ingredients"]')
      .map((el) => cleanLine(el.getAttribute("content") ?? el.text))
      .filter(Boolean);

    const steps: string[] = [];
    for (const el of scope.querySelectorAll('[itemprop~="recipeInstructions"]')) {
      const items = el.querySelectorAll("li");
      if (items.length) {
        for (const li of items) steps.push(...splitStepText(li.innerHTML));
      } else {
        steps.push(...splitStepText(el.getAttribute("content") ?? el.innerHTML));
      }
    }

    const nameEl = scope.querySelector('[itemprop~="name"]');
    const catEl = scope.querySelector('[itemprop~="recipeCategory"]');
    out.push({
      title: nameEl ? cleanLine(nameEl.getAttribute("content") ?? nameEl.text) : undefined,
      ingredients: ingredients.length ? dedupeAdjacent(ingredients).join("\n") : undefined,
      instructions: steps.length ? formatInstructions([{ steps }]) : undefined,
      category: catEl ? cleanLine(catEl.getAttribute("content") ?? catEl.text).slice(0, 60) || undefined : undefined,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Formatting helpers

function formatInstructions(blocks: StepBlock[]): string {
  const parts = blocks.map((block) => {
    const lines = dedupeAdjacent(block.steps).map((s, i) => `${i + 1}. ${s}`);
    return block.name ? [`${block.name}:`, ...lines].join("\n") : lines.join("\n");
  });
  return parts.join("\n\n");
}

function toList(v: Json): string[] {
  if (v == null) return [];
  if (typeof v === "string") return [v];
  if (Array.isArray(v)) return v.flatMap(toList);
  if (typeof v === "object") {
    const obj = v as Record<string, Json>;
    if (typeof obj.text === "string") return [obj.text];
    if (typeof obj.name === "string") return [obj.name];
  }
  return [];
}

/** Decodes entities and drops tags, keeping line breaks from <br>/<p>/<li>. */
function htmlToText(s: string): string {
  if (!/[<&]/.test(s)) return s;
  const withBreaks = s.replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div|li|h[1-6])\s*>/gi, "$&\n");
  // Decode twice: some sites double-escape (e.g. "&amp;#39;").
  let text = parse(`<div>${withBreaks}</div>`).text;
  if (/&(#\d+|#x[0-9a-f]+|[a-z]+);/i.test(text)) text = parse(`<div>${text}</div>`).text;
  return text;
}

function cleanLine(s: string): string {
  return htmlToText(s).replace(/\s+/g, " ").trim();
}

/** Like cleanLine, but also drops numbering the site already added ("1.", "Step 2:"). */
function cleanStep(s: string): string {
  return cleanLine(s)
    .replace(/^(step\s*)?\d+\s*[.):-]\s+/i, "")
    .replace(/^step\s*\d+\s*$/i, "")
    .trim();
}

function dedupeAdjacent(items: string[]): string[] {
  return items.filter((item, i) => i === 0 || item !== items[i - 1]);
}

function pageTitle(root: HTMLElement): string | undefined {
  const og = root.querySelector('meta[property="og:title"]')?.getAttribute("content");
  const t = og ?? root.querySelector("title")?.text;
  return t ? cleanLine(t).slice(0, 200) : undefined;
}
