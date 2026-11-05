"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireProfileComplete } from "@/lib/authz";

export async function addComment(recipeId: string, formData: FormData) {
  const session = await requireProfileComplete();
  const body = formData.get("body");
  if (typeof body !== "string" || !body.trim()) return;

  await prisma.comment.create({
    data: {
      recipeId,
      userId: session.user.id,
      body: body.trim(),
    },
  });

  revalidatePath(`/recipes/${recipeId}`);
}

export async function toggleFavorite(recipeId: string) {
  const session = await requireAuth();

  const existing = await prisma.favorite.findUnique({
    where: { userId_recipeId: { userId: session.user.id, recipeId } },
  });

  if (existing) {
    await prisma.favorite.delete({
      where: { userId_recipeId: { userId: session.user.id, recipeId } },
    });
  } else {
    await prisma.favorite.create({
      data: { userId: session.user.id, recipeId },
    });
  }

  revalidatePath(`/recipes/${recipeId}`);
  revalidatePath("/profile");
}
