"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/authz";
import { collectSubtreeIds } from "@/lib/commentTree";
import { revokeCommentXp } from "@/lib/xp";

/** Staff (admins and moderators) can remove any comment — and with it, its replies. */
export async function deleteComment(commentId: string) {
  await requireStaff();
  const target = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { recipeId: true },
  });
  if (!target) return;

  // Replies are deleted with their parent (cascade), so collect the whole
  // sub-thread first to take back any XP those comments earned.
  const rows = await prisma.comment.findMany({
    where: { recipeId: target.recipeId },
    select: { id: true, parentId: true },
  });
  const subtree = collectSubtreeIds(commentId, rows);

  const comment = await prisma.comment.delete({
    where: { id: commentId },
    select: { recipeId: true },
  });
  // Spam shouldn't keep the XP it earned.
  for (const id of subtree) await revokeCommentXp(id);
  revalidatePath("/admin/comments");
  revalidatePath("/admin");
  revalidatePath(`/recipes/${comment.recipeId}`);
}
