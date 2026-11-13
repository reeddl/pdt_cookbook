import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { buttonStyles } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import { Card, Badge } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { approveRecipe, rejectRecipe } from "../actions";

export default async function PendingRecipesPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string }>;
}) {
  const { done } = await searchParams;
  const recipes = await prisma.recipe.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-4">
      {(done === "approved" || done === "rejected") && (
        <div className="rounded-3xl bg-status-lime-background p-4 text-body-regular text-status-lime-text">
          {done === "approved"
            ? "Approved. The recipe is now in the cookbook."
            : "Rejected. The submitter will see your reason on their profile."}
        </div>
      )}
      {recipes.length === 0 ? (
        <p className="text-body-regular text-text-secondary">No recipe submissions waiting for review.</p>
      ) : (
        recipes.map((recipe) => (
          <Card key={recipe.id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <Link
                  href={`/recipes/${recipe.id}`}
                  className="font-medium break-words text-text-primary hover:underline"
                >
                  {recipe.title}
                </Link>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Badge>{recipe.category}</Badge>
                  <span className="text-caption-1-regular text-text-secondary">
                    submitted by {recipe.submitterName}
                  </span>
                </div>
                <p className="mt-3 whitespace-pre-line break-words text-body-regular text-text-secondary">
                  {recipe.ingredients}
                </p>
              </div>
              {recipe.photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={recipe.photoUrl}
                  alt={recipe.title}
                  className="h-16 w-16 flex-shrink-0 rounded-2lg object-cover sm:h-24 sm:w-24"
                />
              )}
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
              <Link
                href={`/recipes/${recipe.id}`}
                className={cx(buttonStyles.base, buttonStyles.size.medium, buttonStyles.variant.secondary, "px-3 max-sm:min-h-11")}
              >
                Open full preview
              </Link>
              <form action={approveRecipe.bind(null, recipe.id)}>
                <SubmitButton variant="primary" pendingLabel="Approving…">
                  Approve
                </SubmitButton>
              </form>
              <form action={rejectRecipe.bind(null, recipe.id)} className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
                <Input name="reason" placeholder="Reason for the submitter (required)" required className="sm:w-72" />
                <SubmitButton variant="danger" pendingLabel="Rejecting…">
                  Reject
                </SubmitButton>
              </form>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
