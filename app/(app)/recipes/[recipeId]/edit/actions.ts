"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/authz";
import { recipeInputSchema } from "@/lib/validations/recipe";
import { EDITABLE_STATUSES } from "@/lib/recipe-edit/permissions";

function parseRecipeFormData(formData: FormData) {
  return recipeInputSchema.parse({
    title: formData.get("title"),
    ingredients: formData.get("ingredients"),
    instructions: formData.get("instructions"),
    category: formData.get("category"),
    tags: formData.get("tags") ?? "",
    photoUrl: formData.get("photoUrl") || undefined,
    submitterName: formData.get("submitterName"),
  });
}

/**
 * Saves edits to a published or pending recipe in place. Its author and admins
 * may edit (see canEditRecipe); status, review history, likes and comments are
 * left as they are, so a published recipe stays live and a pending one stays in
 * the review queue. The permission check lives in the `where`, so a forged
 * request or a recipe rejected since the form was opened can't slip through.
 */
export async function saveRecipeEdits(recipeId: string, formData: FormData) {
  const session = await requireAuth();
  const data = parseRecipeFormData(formData);
  const isAdmin = session.user.role === "ADMIN";

  const { count } = await prisma.recipe.updateMany({
    where: {
      id: recipeId,
      status: { in: EDITABLE_STATUSES },
      ...(isAdmin ? {} : { submittedById: session.user.id }),
    },
    data: { ...data, photoUrl: data.photoUrl || null },
  });
  if (count === 0) throw new Error("You can't edit this recipe");

  const recipe = await prisma.recipe.findUniqueOrThrow({
    where: { id: recipeId },
    select: { status: true },
  });

  // Titles and categories also show in the sidebar, cards and profiles.
  revalidatePath("/", "layout");
  redirect(recipe.status === "PUBLISHED" ? `/recipes/${recipeId}?edited=1` : `/recipes/${recipeId}/edit?saved=1`);
}

/**
 * Authors can only touch their own *rejected* recipes. The ownership and status
 * checks live in the `where`, so a stale tab or forged request can't edit a
 * recipe that has since been approved or re-queued.
 */
export async function resubmitRecipe(recipeId: string, formData: FormData) {
  const session = await requireAuth();
  const data = parseRecipeFormData(formData);

  const { count } = await prisma.recipe.updateMany({
    where: { id: recipeId, submittedById: session.user.id, status: "REJECTED" },
    data: {
      ...data,
      photoUrl: data.photoUrl || null,
      // Back into the review queue with a clean slate.
      status: "PENDING",
      rejectionReason: null,
      reviewedById: null,
      reviewedAt: null,
    },
  });
  if (count === 0) throw new Error("This recipe can no longer be edited");

  revalidatePath("/profile");
  revalidatePath("/admin/recipes/pending");
  redirect("/profile?resubmitted=1");
}

export async function deleteRejectedRecipe(recipeId: string) {
  const session = await requireAuth();
  await prisma.recipe.deleteMany({
    where: { id: recipeId, submittedById: session.user.id, status: "REJECTED" },
  });
  revalidatePath("/profile");
}
