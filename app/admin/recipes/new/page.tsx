import { auth } from "@/auth";
import { getTagSuggestions } from "@/lib/recipes";
import { RecipeForm } from "@/components/recipes/RecipeForm";
import { createRecipe } from "../actions";

export default async function NewRecipePage() {
  const [session, tagSuggestions] = await Promise.all([auth(), getTagSuggestions()]);

  return (
    <div>
      <h2 className="mb-6 text-title-2-semibold text-text-primary">New recipe</h2>
      <RecipeForm
        action={createRecipe}
        submitLabel="Publish recipe"
        pendingLabel="Publishing…"
        tagSuggestions={tagSuggestions}
        defaultValues={{ submitterName: session?.user.name ?? "" }}
      />
    </div>
  );
}
