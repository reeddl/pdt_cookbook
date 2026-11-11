"use server";

import { requireAuth } from "@/lib/authz";
import { fetchPageHtml, FetchPageError } from "./fetch-page";
import { parseRecipeHtml, type ImportedRecipe } from "./parse";

export type ImportRecipeResult =
  | { ok: true; recipe: ImportedRecipe; sourceUrl: string }
  | { ok: false; message: string };

/**
 * Fetches a recipe page and pulls out its title, ingredients and directions.
 * Nothing is saved: the result only pre-fills the submit form for review.
 */
export async function importRecipeFromUrl(url: string): Promise<ImportRecipeResult> {
  await requireAuth();

  if (typeof url !== "string" || url.length > 2048) {
    return { ok: false, message: "That doesn't look like a web link." };
  }

  let html: string;
  let finalUrl: string;
  try {
    ({ html, finalUrl } = await fetchPageHtml(url));
  } catch (e) {
    if (e instanceof FetchPageError) return { ok: false, message: e.message };
    return { ok: false, message: "Couldn't reach that page." };
  }

  const parsed = parseRecipeHtml(html);
  if (!parsed.ok) {
    return {
      ok: false,
      message:
        parsed.reason === "incomplete"
          ? "We found part of a recipe on that page but not both the ingredients and the directions. You can enter it by hand below."
          : "We couldn't find a recipe on that page. You can enter it by hand below.",
    };
  }

  return { ok: true, recipe: parsed.recipe, sourceUrl: finalUrl };
}
