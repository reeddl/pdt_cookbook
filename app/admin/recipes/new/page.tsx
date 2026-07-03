import { auth } from "@/auth";
import { RecipeForm } from "@/components/recipes/RecipeForm";
import { createRecipe } from "../actions";

export default async function NewRecipePage() {
  const session = await auth();

  return (
    <div>
      <h2 className="mb-6 font-display text-xl text-text">New recipe</h2>
      <RecipeForm
        action={createRecipe}
        submitLabel="Publish recipe"
        defaultValues={{ submitterName: session?.user.name ?? "" }}
      />
    </div>
  );
}
