"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireProfileComplete } from "@/lib/authz";
import { recipeInputSchema } from "@/lib/validations/recipe";

export async function submitRecipe(formData: FormData) {
  const session = await requireProfileComplete();

  const data = recipeInputSchema.parse({
    title: formData.get("title"),
    ingredients: formData.get("ingredients"),
    instructions: formData.get("instructions"),
    category: formData.get("category"),
    tags: formData.get("tags") ?? "",
    photoUrl: formData.get("photoUrl") || undefined,
    submitterName: formData.get("submitterName"),
  });

  await prisma.recipe.create({
    data: {
      ...data,
      photoUrl: data.photoUrl || null,
      status: "PENDING",
      submittedById: session.user.id,
    },
  });

  redirect("/recipes/submit?submitted=1");
}
