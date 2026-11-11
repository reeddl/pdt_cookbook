import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getTagSuggestions } from "@/lib/recipes";
import { canEditRecipe } from "@/lib/recipe-edit/permissions";
import { RecipeForm } from "@/components/recipes/RecipeForm";
import { resubmitRecipe, saveRecipeEdits } from "./actions";

/**
 * One edit page for a recipe, whatever its state:
 * - rejected (author only): fix it up and resubmit for review
 * - published or pending (author or admin): edit in place, status unchanged
 */
export default async function EditRecipePage({
  params,
  searchParams,
}: {
  params: Promise<{ recipeId: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.status !== "APPROVED") redirect("/recipes");
  const [{ recipeId }, { saved }] = await Promise.all([params, searchParams]);

  const [recipe, tagSuggestions] = await Promise.all([
    prisma.recipe.findUnique({ where: { id: recipeId } }),
    getTagSuggestions(),
  ]);
  if (!recipe) notFound();

  const isAuthor = recipe.submittedById === session.user.id;
  const rejected = recipe.status === "REJECTED";
  if (rejected ? !isAuthor : !canEditRecipe(session.user, recipe)) notFound();

  const defaultValues = {
    title: recipe.title,
    category: recipe.category,
    tags: recipe.tags,
    ingredients: recipe.ingredients,
    instructions: recipe.instructions,
    submitterName: recipe.submitterName,
    photoUrl: recipe.photoUrl,
  };

  if (rejected) {
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
          defaultValues={defaultValues}
        />
      </div>
    );
  }

  const pending = recipe.status === "PENDING";
  const backHref = pending ? "/profile" : `/recipes/${recipe.id}`;

  return (
    <div>
      <Link href={backHref} className="text-body-regular text-button-ghost-foreground hover:underline">
        ← {pending ? "Back to your profile" : "Back to the recipe"}
      </Link>
      <h1 className="mt-3 mb-2 text-title-1-semibold break-words text-text-primary">Edit recipe</h1>
      <p className="mb-6 text-body-regular text-text-secondary">
        {pending
          ? "This recipe is still awaiting review. Your changes are saved to it and it stays in the queue."
          : "Changes show in the cookbook as soon as you save. Likes and comments stay with the recipe."}
        {!isAuthor && ` You're editing ${recipe.submitterName}'s recipe as an admin.`}
      </p>
      {saved && (
        <div className="mb-6 rounded-3xl bg-status-lime-background p-4 text-body-regular text-status-lime-text">
          Saved. It&apos;s still awaiting review.
        </div>
      )}
      <RecipeForm
        action={saveRecipeEdits.bind(null, recipe.id)}
        submitLabel="Save changes"
        tagSuggestions={tagSuggestions}
        defaultValues={defaultValues}
      />
    </div>
  );
}
