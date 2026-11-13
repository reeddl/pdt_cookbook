"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireStaff } from "@/lib/authz";
import { recipeInputSchema } from "@/lib/validations/recipe";
import { awardRecipePublished } from "@/lib/xp";

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

export async function createRecipe(formData: FormData) {
  await requireAdmin();
  const data = parseRecipeFormData(formData);

  await prisma.recipe.create({
    data: {
      ...data,
      photoUrl: data.photoUrl || null,
      status: "PUBLISHED",
    },
  });

  revalidatePath("/admin/recipes");
  revalidatePath("/recipes");
  redirect("/admin/recipes");
}

export async function updateRecipe(recipeId: string, formData: FormData) {
  await requireAdmin();
  const data = parseRecipeFormData(formData);

  await prisma.recipe.update({
    where: { id: recipeId },
    data: {
      ...data,
      photoUrl: data.photoUrl || null,
    },
  });

  revalidatePath("/admin/recipes");
  revalidatePath("/recipes");
  revalidatePath(`/recipes/${recipeId}`);
  redirect("/admin/recipes");
}

export async function deleteRecipe(recipeId: string) {
  await requireAdmin();
  await prisma.recipe.delete({ where: { id: recipeId } });
  revalidatePath("/admin/recipes");
  revalidatePath("/recipes");
}

/**
 * Review decisions only apply to a recipe that is still awaiting review, so two
 * reviewers acting at once (or a stale tab) can't re-approve, un-publish or
 * reject a recipe someone else has already handled.
 */
export async function approveRecipe(recipeId: string) {
  const session = await requireStaff();
  const { count } = await prisma.recipe.updateMany({
    where: { id: recipeId, status: "PENDING" },
    data: {
      status: "PUBLISHED",
      reviewedById: session.user.id,
      reviewedAt: new Date(),
    },
  });
  if (count === 0) throw new Error("This recipe isn't awaiting review any more");
  const recipe = await prisma.recipe.findUniqueOrThrow({
    where: { id: recipeId },
    select: { id: true, submittedById: true },
  });
  // Idempotent per recipe, so re-approving can't pay out twice.
  await awardRecipePublished(recipe);
  revalidatePath("/", "layout");
}

export async function rejectRecipe(recipeId: string, formData: FormData) {
  const session = await requireStaff();
  const reason = formData.get("reason");
  if (typeof reason !== "string" || !reason.trim()) {
    throw new Error("A rejection reason is required so the submitter knows what to fix");
  }
  const { count } = await prisma.recipe.updateMany({
    where: { id: recipeId, status: "PENDING" },
    data: {
      status: "REJECTED",
      reviewedById: session.user.id,
      reviewedAt: new Date(),
      rejectionReason: reason.trim(),
    },
  });
  if (count === 0) throw new Error("This recipe isn't awaiting review any more");
  revalidatePath("/", "layout");
}

/** Same decisions, made from a recipe's full-page preview: back to the queue after. */
export async function approveRecipeFromPreview(recipeId: string) {
  await approveRecipe(recipeId);
  redirect("/admin/recipes/pending?done=approved");
}

export async function rejectRecipeFromPreview(recipeId: string, formData: FormData) {
  await rejectRecipe(recipeId, formData);
  redirect("/admin/recipes/pending?done=rejected");
}
