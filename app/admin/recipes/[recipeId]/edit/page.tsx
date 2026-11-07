import { requireAdminPage } from "@/lib/authz";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTagSuggestions } from "@/lib/recipes";
import { RecipeForm } from "@/components/recipes/RecipeForm";
import { updateRecipe } from "../../actions";

export default async function EditRecipePage({
  params,
}: {
  params: Promise<{ recipeId: string }>;
}) {
  await requireAdminPage();
  const { recipeId } = await params;
  const [recipe, tagSuggestions] = await Promise.all([
    prisma.recipe.findUnique({ where: { id: recipeId } }),
    getTagSuggestions(),
  ]);
  if (!recipe) notFound();

  return (
    <div>
      <h2 className="mb-6 text-title-2-semibold text-text-primary">Edit recipe</h2>
      <RecipeForm
        action={updateRecipe.bind(null, recipe.id)}
        submitLabel="Save changes"
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
