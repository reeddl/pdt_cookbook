import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/**
 * Link import: fetch a recipe page and read its schema.org/Recipe JSON-LD.
 * No AI involved — nearly every recipe site publishes this data for search
 * engines. Sites without it fail with a friendly message.
 */

export interface ImportedRecipe {
  title: string;
  category: string;
  tags: string[];
  /** One ingredient per line, as published by the source. */
  ingredients: string;
  /** One step per line. */
  instructions: string;
  photoUrl: string | null;
  sourceUrl: string;
  sourceHost: string;
}

export type ImportResult =
  | { ok: true; recipe: ImportedRecipe }
  | { ok: false; error: string };

const MAX_BYTES = 3 * 1024 * 1024;
const TIMEOUT_MS = 8000;
const MAX_REDIRECTS = 3;

// --- SSRF guard -------------------------------------------------------------

function isPrivateIPv4(ip: string): boolean {
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isPrivateIP(ip: string): boolean {
  if (isIP(ip) === 4) return isPrivateIPv4(ip);
  const v6 = ip.toLowerCase();
  const mapped = v6.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIPv4(mapped[1]);
  return (
    v6 === "::" ||
    v6 === "::1" ||
    v6.startsWith("fc") ||
    v6.startsWith("fd") ||
    v6.startsWith("fe8") ||
    v6.startsWith("fe9") ||
    v6.startsWith("fea") ||
    v6.startsWith("feb")
  );
}

async function assertPublicUrl(url: URL): Promise<void> {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http(s) links can be imported.");
  }
  if (url.username || url.password) {
    throw new Error("That link isn't allowed.");
  }
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal")) {
    throw new Error("That link isn't allowed.");
  }
  const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
  if (addresses.length === 0 || addresses.some((a) => isPrivateIP(a.address))) {
    throw new Error("That link isn't allowed.");
  }
}

async function readCapped(res: Response): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BYTES) {
      await reader.cancel();
      throw new Error("That page is too large to import.");
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function fetchHtml(startUrl: URL): Promise<string> {
  let url = startUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicUrl(url);
    const res = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        // Some recipe sites refuse requests with no browser-like agent.
        "User-Agent": "Mozilla/5.0 (compatible; PDTCookbookBot/1.0)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) throw new Error("The site redirected without a destination.");
      url = new URL(location, url);
      continue;
    }
    if (!res.ok) throw new Error(`The site responded with an error (${res.status}).`);
    const type = res.headers.get("content-type") ?? "";
    if (!type.includes("html")) throw new Error("That link doesn't look like a web page.");
    return readCapped(res);
  }
  throw new Error("Too many redirects.");
}

// --- JSON-LD parsing --------------------------------------------------------

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  frac12: "½",
  frac14: "¼",
  frac34: "¾",
  deg: "°",
};

function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-z0-9]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
}

/** Strip tags/entities and collapse whitespace from a JSON-LD text value. */
function clean(value: unknown): string {
  if (typeof value !== "string") return "";
  return decodeEntities(value.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

type Json = unknown;
type JsonObject = Record<string, Json>;

function isObject(v: Json): v is JsonObject {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function hasType(node: JsonObject, type: string): boolean {
  const t = node["@type"];
  return Array.isArray(t) ? t.includes(type) : t === type;
}

function findRecipeNode(root: Json): JsonObject | null {
  if (Array.isArray(root)) {
    for (const item of root) {
      const found = findRecipeNode(item);
      if (found) return found;
    }
    return null;
  }
  if (!isObject(root)) return null;
  if (hasType(root, "Recipe")) return root;
  if (root["@graph"]) return findRecipeNode(root["@graph"]);
  return null;
}

function extractRecipeNode(html: string): JsonObject | null {
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const m of html.matchAll(re)) {
    try {
      const found = findRecipeNode(JSON.parse(m[1].trim()));
      if (found) return found;
    } catch {
      // Malformed block — keep looking at the next one.
    }
  }
  return null;
}

function asArray(v: Json): Json[] {
  return v === undefined || v === null ? [] : Array.isArray(v) ? v : [v];
}

function extractSteps(v: Json): string[] {
  const out: string[] = [];
  for (const item of asArray(v)) {
    if (typeof item === "string") {
      // Some sites ship the whole method as one blob separated by newlines.
      for (const line of item.split(/\r?\n|<br\s*\/?>/i)) {
        const text = clean(line);
        if (text) out.push(text);
      }
    } else if (isObject(item)) {
      if (item.itemListElement) {
        out.push(...extractSteps(item.itemListElement)); // HowToSection
      } else {
        const text = clean(item.text) || clean(item.name);
        if (text) out.push(text);
      }
    }
  }
  return out;
}

function extractImage(v: Json, base: URL): string | null {
  for (const item of asArray(v)) {
    const candidate = typeof item === "string" ? item : isObject(item) ? item.url : null;
    if (typeof candidate === "string") {
      try {
        const u = new URL(candidate, base);
        if (u.protocol === "http:" || u.protocol === "https:") return u.toString();
      } catch {
        // ignore unparsable image URLs
      }
    }
  }
  return null;
}

function extractTags(node: JsonObject, category: string): string[] {
  const raw = asArray(node.keywords).flatMap((k) =>
    typeof k === "string" ? k.split(",") : []
  );
  const seen = new Set<string>([category.toLowerCase()]);
  const tags: string[] = [];
  for (const k of raw) {
    const tag = clean(k);
    const key = tag.toLowerCase();
    if (tag && tag.length <= 30 && !seen.has(key)) {
      seen.add(key);
      tags.push(tag);
    }
    if (tags.length >= 5) break;
  }
  return tags;
}

export async function importRecipeFromUrl(rawUrl: string): Promise<ImportResult> {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return { ok: false, error: "That doesn't look like a valid link." };
  }

  let html: string;
  try {
    html = await fetchHtml(url);
  } catch (err) {
    const message =
      err instanceof Error && err.name === "TimeoutError"
        ? "The site took too long to respond."
        : err instanceof Error && !/fetch failed|ENOTFOUND|EAI_AGAIN/i.test(err.message)
          ? err.message
          : "Couldn't reach that site.";
    return { ok: false, error: message };
  }

  return parseRecipeHtml(html, url);
}

/** Reads the first schema.org/Recipe found in a page's JSON-LD. Pure, so it is easy to test. */
export function parseRecipeHtml(html: string, url: URL): ImportResult {
  const node = extractRecipeNode(html);
  if (!node) {
    return {
      ok: false,
      error: "This page doesn't publish recipe data we can read. You can still enter it by hand below.",
    };
  }

  const title = clean(node.name);
  const ingredients = asArray(node.recipeIngredient).map(clean).filter(Boolean);
  const steps = extractSteps(node.recipeInstructions);
  if (!title || ingredients.length === 0 || steps.length === 0) {
    return { ok: false, error: "That recipe is missing ingredients or steps, so we couldn't import it." };
  }

  const category = clean(asArray(node.recipeCategory)[0]);

  return {
    ok: true,
    recipe: {
      title: title.slice(0, 200),
      category: category.slice(0, 60),
      tags: extractTags(node, category),
      ingredients: ingredients.join("\n"),
      instructions: steps.join("\n"),
      photoUrl: extractImage(node.image, url),
      sourceUrl: url.toString(),
      sourceHost: url.hostname.replace(/^www\./, ""),
    },
  };
}
