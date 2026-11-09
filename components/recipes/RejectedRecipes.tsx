"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { buttonStyles } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import { SubmitButton } from "@/components/ui/submit-button";
import { deleteRejectedRecipe } from "@/app/(app)/recipes/[recipeId]/edit/actions";

export interface RejectedRecipe {
  id: string;
  title: string;
  category: string;
  rejectionReason: string | null;
}

/** Recipes sent back by a reviewer: shows why, and lets the author fix or drop them. */
export function RejectedRecipes({ recipes }: { recipes: RejectedRecipe[] }) {
  if (recipes.length === 0) return null;
  return (
    <section id="needs-attention" className="mt-8 scroll-mt-6">
      <h2 className="mb-1 text-title-3-semibold text-text-primary">Sent back to you</h2>
      <p className="mb-4 text-body-regular text-text-secondary">
        A reviewer couldn&apos;t accept these yet. Fix them up and resubmit, or delete them.
      </p>
      <div className="space-y-3">
        {recipes.map((recipe) => (
          <Card key={recipe.id} className="p-4">
            <p className="font-medium break-words text-text-primary">{recipe.title}</p>
            <p className="mt-2 whitespace-pre-line break-words rounded-2lg bg-background-tertiary-error p-3 text-body-regular text-text-error-primary">
              <span className="text-body-medium">Reviewer note: </span>
              {recipe.rejectionReason ?? "No reason was given."}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Link
                href={`/recipes/${recipe.id}/edit`}
                className={cx(buttonStyles.base, buttonStyles.size.medium, buttonStyles.variant.primary, "px-3 max-sm:min-h-11")}
              >
                Edit &amp; resubmit
              </Link>
              <form
                action={deleteRejectedRecipe.bind(null, recipe.id)}
                onSubmit={(e) => {
                  if (!window.confirm(`Delete “${recipe.title}”? This can't be undone.`)) e.preventDefault();
                }}
              >
                <SubmitButton variant="danger" pendingLabel="Deleting…">
                  Delete
                </SubmitButton>
              </form>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
