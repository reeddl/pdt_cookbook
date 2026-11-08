import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getTagSuggestions } from "@/lib/recipes";
import { RecipeForm } from "@/components/recipes/RecipeForm";
import { resubmitRecipe } from "./actions";

export default async function EditRejectedRecipePage({
  params,
}: {
  params: Promise<{ recipeId: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  const { recipeId } = await params;

  const [recipe, tagSuggestions] = await Promise.all([
    prisma.recipe.findFirst({
      where: { id: recipeId, submittedById: session.user.id, status: "REJECTED" },
    }),
    getTagSuggestions(),
  ]);
  if (!recipe) notFound();

  return (
    <div>
      <h1 className="mb-2 text-title-1-semibold text-text-primary">Edit and resubmit</h1>
      <div className="mb-6 rounded-3xl bg-background-tertiary-error p-4 text-body-regular text-text-error-primary">
        <p className="text-body-medium">Why this wasn&apos;t accepted</p>
        <p className="mt-1 whitespace-pre-line">{recipe.rejectionReason ?? "No reason was given."}</p>
      </div>
      <RecipeForm
        action={resubmitRecipe.bind(null, recipe.id)}
        submitLabel="Resubmit for review"
        pendingLabel="Resubmitting…"
        tagSuggestions={tagSuggestions}
        defaultValues={{
          title: recipe.title,
          category: recipe.category,
          tags: recipe.tags,
          ingredients: recipe.ingredients,
          instructions: recipe.instructions,
          submitterName: recipe.submitterName,
          photoUrl: recipe.photoUrl,
        }}
      />
    </div>
  );
}
