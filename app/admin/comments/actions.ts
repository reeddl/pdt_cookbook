"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/authz";
import { revokeCommentXp } from "@/lib/xp";

/** Staff (admins and moderators) can remove any comment. */
export async function deleteComment(commentId: string) {
  await requireStaff();
  const comment = await prisma.comment.delete({
    where: { id: commentId },
    select: { recipeId: true },
  });
  // Spam shouldn't keep the XP it earned.
  await revokeCommentXp(commentId);
  revalidatePath("/admin/comments");
  revalidatePath("/admin");
  revalidatePath(`/recipes/${comment.recipeId}`);
}
