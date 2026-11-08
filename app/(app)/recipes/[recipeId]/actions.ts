"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireProfileComplete } from "@/lib/authz";
import { awardComment, awardLike } from "@/lib/xp";

/** `parentId` is set when replying to another comment. */
export async function addComment(recipeId: string, parentId: string | null, formData: FormData) {
  const session = await requireProfileComplete();
  const body = formData.get("body");
  if (typeof body !== "string" || !body.trim()) return;

  const recipe = await prisma.recipe.findFirst({
    where: { id: recipeId, status: "PUBLISHED" },
    select: { id: true, submittedById: true },
  });
  if (!recipe) return;

  if (parentId) {
    // A reply must hang off a comment on this same recipe.
    const parent = await prisma.comment.findFirst({
      where: { id: parentId, recipeId },
      select: { id: true },
    });
    if (!parent) return;
  }

  const comment = await prisma.comment.create({
    data: {
      recipeId,
      parentId,
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

export async function toggleCommentLike(commentId: string) {
  const session = await requireAuth();
  const userId = session.user.id;

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { recipeId: true },
  });
  if (!comment) return;

  const key = { userId_commentId: { userId, commentId } };
  const existing = await prisma.commentLike.findUnique({ where: key });
  if (existing) await prisma.commentLike.delete({ where: key });
  else await prisma.commentLike.create({ data: { userId, commentId } });

  revalidatePath(`/recipes/${comment.recipeId}`);
}
