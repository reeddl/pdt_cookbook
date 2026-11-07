"use server";

import { requireAuth } from "@/lib/authz";
import { importRecipeFromUrl, type ImportResult } from "@/lib/recipeImport";

/** Reads a recipe from a pasted link. Any signed-in member may use it. */
export async function importRecipe(url: string): Promise<ImportResult> {
  await requireAuth();
  if (typeof url !== "string" || url.length > 2000) {
    return { ok: false, error: "That doesn't look like a valid link." };
  }
  return importRecipeFromUrl(url);
}
