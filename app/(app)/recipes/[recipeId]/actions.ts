"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireProfileComplete } from "@/lib/authz";
import { awardComment, awardLike } from "@/lib/xp";

export async function addComment(recipeId: string, formData: FormData) {
  const session = await requireProfileComplete();
  const body = formData.get("body");
  if (typeof body !== "string" || !body.trim()) return;

  const recipe = await prisma.recipe.findFirst({
    where: { id: recipeId, status: "PUBLISHED" },
    select: { id: true, submittedById: true },
  });
  if (!recipe) return;

  const comment = await prisma.comment.create({
    data: {
      recipeId,
      userId: session.user.id,
      body: body.trim(),
    },
  });

  // Posting always works; only substantive, non-spammy comments earn XP.
  await awardComment({ userId: session.user.id, commentId: comment.id, body: comment.body, recipe });

  revalidatePath(`/recipes/${recipeId}`);
}

export async function toggleLike(recipeId: string) {
  const session = await requireAuth();
  const userId = session.user.id;

  const existing = await prisma.like.findUnique({
    where: { userId_recipeId: { userId, recipeId } },
  });

  if (existing) {
    // Un-liking keeps any XP already paid out; re-liking can't earn it twice.
    await prisma.like.delete({ where: { userId_recipeId: { userId, recipeId } } });
  } else {
    const recipe = await prisma.recipe.findFirst({
      where: { id: recipeId, status: "PUBLISHED" },
      select: { id: true, submittedById: true },
    });
    if (!recipe) return;
    await prisma.like.create({ data: { userId, recipeId } });
    await awardLike({ likerId: userId, recipe });
  }

  revalidatePath(`/recipes/${recipeId}`);
  revalidatePath("/likes");
}
