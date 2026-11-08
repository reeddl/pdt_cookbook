"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/authz";
import { recipeInputSchema } from "@/lib/validations/recipe";

/**
 * Authors can only touch their own *rejected* recipes. The ownership and status
 * checks live in the `where`, so a stale tab or forged request can't edit a
 * recipe that has since been approved or re-queued.
 */
export async function resubmitRecipe(recipeId: string, formData: FormData) {
  const session = await requireAuth();
  const data = recipeInputSchema.parse({
    title: formData.get("title"),
    ingredients: formData.get("ingredients"),
    instructions: formData.get("instructions"),
    category: formData.get("category"),
    tags: formData.get("tags") ?? "",
    photoUrl: formData.get("photoUrl") || undefined,
    submitterName: formData.get("submitterName"),
  });

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
