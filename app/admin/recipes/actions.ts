"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireStaff } from "@/lib/authz";
import { recipeInputSchema } from "@/lib/validations/recipe";

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

export async function approveRecipe(recipeId: string) {
  const session = await requireStaff();
  await prisma.recipe.update({
    where: { id: recipeId },
    data: {
      status: "PUBLISHED",
      reviewedById: session.user.id,
      reviewedAt: new Date(),
    },
  });
  revalidatePath("/admin/recipes/pending");
  revalidatePath("/admin/recipes");
  revalidatePath("/recipes");
}

export async function rejectRecipe(recipeId: string, formData: FormData) {
  const session = await requireStaff();
  const reason = formData.get("reason");
  await prisma.recipe.update({
    where: { id: recipeId },
    data: {
      status: "REJECTED",
      reviewedById: session.user.id,
      reviewedAt: new Date(),
      rejectionReason: typeof reason === "string" && reason ? reason : null,
    },
  });
  revalidatePath("/admin/recipes/pending");
}
