import { prisma } from "@/lib/prisma";
import { Card, Badge } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { approveRecipe, rejectRecipe } from "../actions";

export default async function PendingRecipesPage() {
  const recipes = await prisma.recipe.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-4">
      {recipes.length === 0 ? (
        <p className="text-body-regular text-text-secondary">No recipe submissions waiting for review.</p>
      ) : (
        recipes.map((recipe) => (
          <Card key={recipe.id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-medium break-words text-text-primary">{recipe.title}</p>
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
