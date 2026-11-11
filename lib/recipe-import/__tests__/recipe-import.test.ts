import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseRecipeHtml } from "../parse";
import { isPublicAddress, normalizeUrl, fetchPageHtml, FetchPageError, safeLookup } from "../fetch-page";

const fixture = (name: string) => readFileSync(join(__dirname, "fixtures", name), "utf8");

function parsed(name: string) {
  const r = parseRecipeHtml(fixture(name));
  assert.equal(r.ok, true, `${name} should parse`);
  if (!r.ok) throw new Error("unreachable");
  return r.recipe;
}

test("WordPress Recipe Maker style @graph with sections", () => {
  const r = parsed("wprm-graph.html");
  assert.equal(r.title, "Easy Weeknight Chili");
  assert.equal(r.category, "Main Course");
  assert.equal(
    r.ingredients,
    [
      "1 Tbsp olive oil ($0.16)",
      "1 yellow onion – diced",
      "2 cloves garlic, minced",
      "1 lb. ground beef",
      "1 (15 oz.) can kidney beans, drained",
      "1 Tbsp chili powder",
    ].join("\n")
  );
  assert.equal(
    r.instructions,
    [
      "Make the base:",
      "1. Dice the onion and mince the garlic.",
      "2. Sauté the onion and garlic in olive oil until soft, about 5 minutes.",
      "",
      "Simmer:",
      "1. Add the beef and cook until browned.",
      "2. Stir in the beans and chili powder. Simmer 20 minutes.",
    ].join("\n")
  );
});

test("top-level array with @type as a list (Allrecipes style)", () => {
  const r = parsed("dotdash-array.html");
  assert.equal(r.title, "Best Chocolate Chip Cookies");
  assert.equal(r.category, "Dessert");
  assert.equal(r.ingredients.split("\n").length, 6);
  assert.equal(r.ingredients.split("\n")[2], "2 large eggs");
  const steps = r.instructions.split("\n");
  assert.equal(steps.length, 5);
  assert.equal(steps[1], "2. Preheat the oven to 350 degrees F (175 degrees C).");
});

test("HTML inside steps becomes separate lines", () => {
  const r = parsed("single-object.html");
  assert.equal(r.title, "Classic lasagne");
  assert.equal(r.category, undefined);
  assert.equal(
    r.instructions,
    [
      "1. Heat the oil in a large pan. Add the onions and fry for 10 mins.",
      "2. Add the mince and fry until browned.",
      "3. Stir in the tomatoes and simmer for 20 mins.",
    ].join("\n")
  );
});

test("plain-string directions with raw newlines and existing numbering", () => {
  const r = parsed("string-instructions.html");
  assert.equal(
    r.instructions,
    [
      "1. Sift the flour and baking powder together.",
      "2. Make a well in the center and pour in the milk and egg.",
      "3. Mix until smooth, then cook on a hot griddle.",
    ].join("\n")
  );
});

test("microdata fallback", () => {
  const r = parsed("microdata.html");
  assert.equal(r.title, "Grandma's Banana Bread");
  assert.equal(r.category, "Bread");
  assert.equal(r.ingredients, "3 ripe bananas\n1/3 cup melted butter\n1 cup sugar");
  assert.equal(
    r.instructions,
    "1. Preheat oven to 350°F.\n2. Mash the bananas & mix in the butter.\n3. Stir in sugar, pour into a loaf pan and bake 1 hour."
  );
});

test("pages without a recipe, or with only half of one, fail clearly", () => {
  assert.deepEqual(parseRecipeHtml(fixture("no-recipe.html")), { ok: false, reason: "no-recipe" });
  assert.deepEqual(parseRecipeHtml(fixture("partial.html")), { ok: false, reason: "incomplete" });
  assert.deepEqual(parseRecipeHtml("not html at all"), { ok: false, reason: "no-recipe" });
});

test("public vs private addresses", () => {
  for (const a of ["8.8.8.8", "151.101.1.140", "2606:4700::6810:85e5"]) assert.equal(isPublicAddress(a), true, a);
  for (const a of [
    "127.0.0.1",
    "10.1.2.3",
    "172.16.0.1",
    "192.168.1.1",
    "169.254.169.254",
    "100.64.0.1",
    "0.0.0.0",
    "224.0.0.1",
    "::1",
    "::",
    "fd00::1",
    "fe80::1",
    "::ffff:127.0.0.1",
    "::ffff:7f00:1",
  ]) {
    assert.equal(isPublicAddress(a), false, a);
  }
});

test("link checks", () => {
  assert.equal(normalizeUrl("example.com/recipe").toString(), "https://example.com/recipe");
  assert.equal(normalizeUrl(" https://example.com/a#jump ").toString(), "https://example.com/a");
  assert.equal(normalizeUrl("www.example.com:443/pie").toString(), "https://www.example.com/pie");
  for (const bad of [
    "",
    "ftp://example.com/x",
    "file:///etc/passwd",
    "javascript:alert(1)",
    "http://localhost:3000/",
    "localhost:3000/recipes",
    "data:text/html,hi",
    "http://127.0.0.1/",
    "http://[::1]/",
    "http://169.254.169.254/latest/meta-data/",
    "http://example.com:8080/",
    "http://user:pw@example.com/",
  ]) {
    assert.throws(() => normalizeUrl(bad), FetchPageError, bad);
  }
});

test("fetch refuses private addresses before connecting", async () => {
  await assert.rejects(fetchPageHtml("http://127.0.0.1/"), { code: "blocked" });
  await assert.rejects(fetchPageHtml("http://app.localhost/"), { code: "blocked" });
});

test("connect-time DNS check refuses names that resolve to private addresses", async () => {
  for (const all of [false, true]) {
    const err = await new Promise<unknown>((resolve) =>
      safeLookup("localhost", { all }, (e: unknown) => resolve(e))
    );
    assert.ok(err instanceof FetchPageError, `all=${all}`);
    assert.equal((err as FetchPageError).code, "blocked");
  }
});
