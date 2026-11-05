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
              <div>
                <p className="font-medium text-text-primary">{recipe.title}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge>{recipe.category}</Badge>
                  <span className="text-caption-1-regular text-text-secondary">
                    submitted by {recipe.submitterName}
                  </span>
                </div>
                <p className="mt-3 whitespace-pre-line text-body-regular text-text-secondary">
                  {recipe.ingredients}
                </p>
              </div>
              {recipe.photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={recipe.photoUrl}
                  alt={recipe.title}
                  className="h-24 w-24 flex-shrink-0 rounded-2lg object-cover"
                />
              )}
            </div>
            <div className="mt-4 flex items-center gap-2">
              <form action={approveRecipe.bind(null, recipe.id)}>
                <SubmitButton variant="primary" pendingLabel="Approving…">
                  Approve
                </SubmitButton>
              </form>
              <form action={rejectRecipe.bind(null, recipe.id)} className="flex items-center gap-2">
                <Input name="reason" placeholder="Rejection reason (optional)" className="w-64" />
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
