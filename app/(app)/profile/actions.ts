"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/authz";
import { profileInputSchema } from "@/lib/validations/profile";

export async function updateOwnProfile(formData: FormData) {
  const session = await requireAuth();

  const data = profileInputSchema.parse({
    name: formData.get("name"),
    bondNumber: formData.get("bondNumber") ?? "",
    pledgeClass: formData.get("pledgeClass") ?? "",
    graduationYear: formData.get("graduationYear") ?? "",
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: data.name,
      bondNumber: data.bondNumber || null,
      pledgeClass: data.pledgeClass || null,
      graduationYear: data.graduationYear,
    },
  });

  revalidatePath("/profile");
}
