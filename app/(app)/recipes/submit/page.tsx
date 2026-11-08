import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { isProfileComplete } from "@/lib/authz";
import { getTagSuggestions } from "@/lib/recipes";
import { RecipeForm } from "@/components/recipes/RecipeForm";
import { submitRecipe } from "./actions";

export default async function SubmitRecipePage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.status !== "APPROVED") redirect("/recipes");
  const { submitted } = await searchParams;
  const [canSubmit, tagSuggestions] = await Promise.all([
    session ? isProfileComplete(session.user.id) : false,
    getTagSuggestions(),
  ]);

  return (
    <div>
      <h1 className="mb-2 text-title-1-semibold text-text-primary">Suggest a recipe</h1>
      <p className="mb-6 text-body-regular text-text-secondary">
        Your submission will be reviewed by an admin before it appears in the cookbook.
      </p>

      {submitted && (
        <div className="mb-6 rounded-3xl bg-status-lime-background p-4 text-body-regular text-status-lime-text">
          Thanks! Your recipe was submitted and is awaiting approval.
        </div>
      )}

      {canSubmit ? (
        <RecipeForm
          action={submitRecipe}
          submitLabel="Submit for review"
          pendingLabel="Submitting…"
          tagSuggestions={tagSuggestions}
          defaultValues={{ submitterName: session?.user.name ?? "" }}
        />
      ) : (
        <p className="text-body-regular text-text-secondary">
          <Link href="/profile" className="text-button-ghost-foreground underline">
            Add your bond number, pledge class, and graduation year
          </Link>{" "}
          to your profile before submitting a recipe.
        </p>
      )}
    </div>
  );
}
