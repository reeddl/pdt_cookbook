"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { profileInputSchema } from "@/lib/validations/profile";
import { getFamilyMembers, getLittlesTree } from "@/lib/family";

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

export async function updateMember(userId: string, formData: FormData) {
  await requireAdmin();

  const profile = profileInputSchema.parse({
    name: formData.get("name"),
    bondNumber: formData.get("bondNumber") ?? "",
    pledgeClass: formData.get("pledgeClass") ?? "",
    graduationYear: formData.get("graduationYear") ?? "",
  });

  const role = formData.get("role") === "ADMIN" ? "ADMIN" : "MEMBER";
  const bigIdRaw = formData.get("bigId");
  let bigId = typeof bigIdRaw === "string" && bigIdRaw ? bigIdRaw : null;

  if (bigId === userId) {
    bigId = null;
  } else if (bigId) {
    const members = await getFamilyMembers();
    const descendants = getLittlesTree(userId, members);
    const isDescendant = (nodes: typeof descendants): boolean =>
      nodes.some((n) => n.id === bigId || isDescendant(n.littles));
    if (isDescendant(descendants)) bigId = null;
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: profile.name,
      bondNumber: profile.bondNumber || null,
      pledgeClass: profile.pledgeClass || null,
      graduationYear: profile.graduationYear,
      role,
      bigId,
    },
  });

  revalidatePath("/admin/users");
  redirect("/admin/users");
}
