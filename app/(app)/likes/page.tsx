import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { RecipeCard } from "@/components/recipes/RecipeCard";

export default async function LikedRecipesPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.status !== "APPROVED") redirect("/recipes");

  const likes = await prisma.like.findMany({
    // A recipe pulled from the cookbook drops off the list until it's back.
    where: { userId: session.user.id, recipe: { status: "PUBLISHED" } },
    include: { recipe: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="mb-1 text-title-1-semibold text-text-primary">Liked recipes</h1>
      <p className="mb-6 text-body-regular text-text-secondary">
        Everything you&apos;ve liked, most recent first.
      </p>
      {likes.length === 0 ? (
        <p className="text-body-regular text-text-secondary">
          You haven&apos;t liked any recipes yet — tap ♡ Like on a recipe to save it here.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {likes.map(({ recipe }) => (
            <RecipeCard
              key={recipe.id}
              id={recipe.id}
              title={recipe.title}
              category={recipe.category}
              photoUrl={recipe.photoUrl}
              submitterName={recipe.submitterName}
              submittedById={recipe.submittedById}
            />
          ))}
        </div>
      )}
    </div>
  );
}
