import { getPublishedRecipes } from "@/lib/recipes";
import { RecipeCard } from "@/components/recipes/RecipeCard";

export default async function RecipesPage() {
  const recipes = await getPublishedRecipes();

  return (
    <div>
      <h1 className="mb-6 text-title-1-semibold text-text-primary">All recipes</h1>
      {recipes.length === 0 ? (
        <p className="text-body-regular text-text-secondary">
          No recipes have been published yet — check back soon.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              id={recipe.id}
              title={recipe.title}
              category={recipe.category}
              photoUrl={recipe.photoUrl}
              submitterName={recipe.submitterName}
              submittedById={recipe.submittedById}
            />
          ))}
        </div>
      )}
    </div>
  );
}
