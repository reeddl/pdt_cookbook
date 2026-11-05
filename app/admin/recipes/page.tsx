import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { deleteRecipe } from "./actions";

export default async function AdminRecipesPage() {
  const recipes = await prisma.recipe.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { title: "asc" },
  });

  return (
    <div className="space-y-3">
      {recipes.length === 0 ? (
        <p className="text-sm text-text-muted">No recipes yet — add the first one.</p>
      ) : (
        recipes.map((recipe) => (
          <Card key={recipe.id} className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium text-text">{recipe.title}</p>
              <div className="mt-1 flex items-center gap-2">
                <Badge>{recipe.category}</Badge>
                <span className="text-xs text-text-muted">by {recipe.submitterName}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href={`/admin/recipes/${recipe.id}/edit`}>
                <Button variant="secondary">Edit</Button>
              </Link>
              <form action={deleteRecipe.bind(null, recipe.id)}>
                <SubmitButton variant="danger" pendingLabel="Deleting…">
                  Delete
                </SubmitButton>
              </form>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
