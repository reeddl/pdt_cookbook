/**
 * Pure helpers shared by the recipe builder and the link importer.
 *
 * Recipes are still stored as two plain strings (`ingredients`, one per line,
 * and `instructions`, one step per line), so everything here converts between
 * that storage format and the structured rows the builder edits.
 */

export const UNITS = [
  "cup",
  "tbsp",
  "tsp",
  "oz",
  "lb",
  "g",
  "kg",
  "ml",
  "l",
  "pinch",
  "dash",
  "clove",
  "can",
  "stick",
  "slice",
  "piece",
] as const;

export interface IngredientRow {
  id: string;
  qty: string;
  unit: string;
  name: string;
}

export interface StepRow {
  id: string;
  text: string;
}

let counter = 0;
export function newId(): string {
  counter += 1;
  return `r${Date.now().toString(36)}${counter}`;
}

const UNICODE_FRACTIONS = "½⅓⅔¼¾⅛⅜⅝⅞";
// "2", "1/2", "1 1/2", "1.5", "½", "1½", "2-3", "2 to 3"
const QTY_RE = new RegExp(
  `^((?:\\d+\\s*[${UNICODE_FRACTIONS}]|\\d+(?:[.,]\\d+)?(?:\\s+\\d+/\\d+|/\\d+)?|[${UNICODE_FRACTIONS}])` +
    `(?:\\s*(?:-|–|to)\\s*(?:\\d+(?:[.,]\\d+)?(?:\\s+\\d+/\\d+|/\\d+)?|[${UNICODE_FRACTIONS}]))?)\\s*`,
  "i"
);

const UNIT_ALIASES: Record<string, string> = {
  cups: "cup",
  c: "cup",
  tablespoon: "tbsp",
  tablespoons: "tbsp",
  tbs: "tbsp",
  tbsps: "tbsp",
  teaspoon: "tsp",
  teaspoons: "tsp",
  tsps: "tsp",
  ounce: "oz",
  ounces: "oz",
  ozs: "oz",
  pound: "lb",
  pounds: "lb",
  lbs: "lb",
  gram: "g",
  grams: "g",
  kilogram: "kg",
  kilograms: "kg",
  milliliter: "ml",
  milliliters: "ml",
  millilitre: "ml",
  millilitres: "ml",
  liter: "l",
  liters: "l",
  litre: "l",
  litres: "l",
  pinches: "pinch",
  dashes: "dash",
  cloves: "clove",
  cans: "can",
  sticks: "stick",
  slices: "slice",
  pieces: "piece",
};

function normalizeUnit(word: string): string | null {
  const w = word.toLowerCase().replace(/\.$/, "");
  if ((UNITS as readonly string[]).includes(w)) return w;
  return UNIT_ALIASES[w] ?? null;
}

/** Split one ingredient line like "1 1/2 cups flour, sifted" into parts. */
export function parseIngredientLine(line: string): Omit<IngredientRow, "id"> {
  let rest = line.trim().replace(/^[-•*]\s*/, "");
  let qty = "";
  let unit = "";

  const q = rest.match(QTY_RE);
  if (q) {
    qty = q[1].trim();
    rest = rest.slice(q[0].length);
    const w = rest.match(/^([A-Za-z]+\.?)(?:\s+|$)/);
    if (w) {
      const u = normalizeUnit(w[1]);
      if (u) {
        unit = u;
        rest = rest.slice(w[0].length);
      }
    }
    rest = rest.replace(/^of\s+/i, "");
  }
  return { qty, unit, name: rest.trim() };
}

export function parseIngredients(text: string | undefined | null): IngredientRow[] {
  return (text ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => ({ id: newId(), ...parseIngredientLine(l) }));
}

/** "1 1/2 cup flour" — the exact text stored and inserted into steps. */
export function formatIngredient(row: Pick<IngredientRow, "qty" | "unit" | "name">): string {
  return [row.qty.trim(), row.unit.trim(), row.name.trim()].filter(Boolean).join(" ");
}

/**
 * What gets dropped into a step: the amount and the ingredient, without prep
 * notes — "2 tbsp butter, softened" becomes "2 tbsp butter".
 */
export function formatIngredientForStep(
  row: Pick<IngredientRow, "qty" | "unit" | "name">
): string {
  return formatIngredient({ ...row, name: row.name.split(",")[0] });
}

export function serializeIngredients(rows: IngredientRow[]): string {
  return rows.map(formatIngredient).filter(Boolean).join("\n");
}

/** Split stored instructions into steps, dropping "1." / "Step 2:" prefixes. */
export function parseSteps(text: string | undefined | null): StepRow[] {
  return (text ?? "")
    .split("\n")
    .map((l) => l.trim().replace(/^(?:step\s*)?\d+\s*[.):-]\s*/i, ""))
    .filter(Boolean)
    .map((t) => ({ id: newId(), text: t }));
}

export function serializeSteps(rows: StepRow[]): string {
  return rows
    .map((s) => s.text.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

// ---------------------------------------------------------------------------
// Measurements-in-the-method rule
// ---------------------------------------------------------------------------

export interface MeasurementWarning {
  stepId: string;
  stepNumber: number;
  ingredient: string;
}

const NUMBER_WORDS =
  "half|quarter|one|two|three|four|five|six|seven|eight|nine|ten|dozen|a couple|a pinch|a dash";
const MEASURE_NEAR_RE = new RegExp(
  `[\\d${UNICODE_FRACTIONS}]|\\b(?:${NUMBER_WORDS})\\b`,
  "i"
);

/** "butter, softened" -> "butter"; "(optional) fresh basil" -> "fresh basil". */
export function ingredientKeyword(name: string): string {
  return name
    .replace(/\([^)]*\)/g, "")
    .split(",")[0]
    .trim()
    .toLowerCase();
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Finds steps that mention an ingredient (that has an amount) without a
 * measurement right before it. This is a nudge, not a gate: wording like
 * "the rest of the butter" will legitimately trip it.
 */
export function findMissingMeasurements(
  ingredients: IngredientRow[],
  steps: StepRow[]
): MeasurementWarning[] {
  const warnings: MeasurementWarning[] = [];
  const measured = ingredients
    .filter((i) => i.qty.trim() && ingredientKeyword(i.name).length >= 3)
    .map((i) => ({ label: ingredientKeyword(i.name) }));

  steps.forEach((step, idx) => {
    const text = step.text;
    for (const { label } of measured) {
      const re = new RegExp(`\\b${escapeRegExp(label)}s?\\b`, "gi");
      const matches = [...text.matchAll(re)];
      if (matches.length === 0) continue;
      const hasMeasure = matches.some((m) => {
        const start = m.index ?? 0;
        // Only the few words just before the name count, so a number that
        // belongs to a different ingredient doesn't excuse this one.
        const before = text.slice(0, start).trim().split(/\s+/).slice(-4).join(" ");
        return MEASURE_NEAR_RE.test(before);
      });
      if (!hasMeasure) {
        warnings.push({ stepId: step.id, stepNumber: idx + 1, ingredient: label });
      }
    }
  });
  return warnings;
}
