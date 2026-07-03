"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";

export async function approveUser(userId: string) {
  await requireAdmin();
  await prisma.user.update({ where: { id: userId }, data: { status: "APPROVED" } });
  revalidatePath("/admin/users");
  revalidatePath("/admin");
}

export async function rejectUser(userId: string) {
  await requireAdmin();
  await prisma.user.update({ where: { id: userId }, data: { status: "REJECTED" } });
  revalidatePath("/admin/users");
  revalidatePath("/admin");
}
