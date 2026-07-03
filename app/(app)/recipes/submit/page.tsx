import { auth } from "@/auth";
import { RecipeForm } from "@/components/recipes/RecipeForm";
import { submitRecipe } from "./actions";

export default async function SubmitRecipePage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const session = await auth();
  const { submitted } = await searchParams;

  return (
    <div>
      <h1 className="mb-2 font-display text-2xl text-text">Suggest a recipe</h1>
      <p className="mb-6 text-sm text-text-muted">
        Your submission will be reviewed by an admin before it appears in the cookbook.
      </p>

      {submitted && (
        <div className="mb-6 rounded-xl bg-success/10 p-4 text-sm text-success">
          Thanks! Your recipe was submitted and is awaiting approval.
        </div>
      )}

      <RecipeForm
        action={submitRecipe}
        submitLabel="Submit for review"
        defaultValues={{ submitterName: session?.user.name ?? "" }}
      />
    </div>
  );
}
