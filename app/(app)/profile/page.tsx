import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { RecipeCard } from "@/components/recipes/RecipeCard";

export default async function ProfilePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    include: { recipe: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="font-display text-2xl text-text">{session.user.name}</h1>
      <p className="text-sm text-text-muted">{session.user.email}</p>

      <section className="mt-8">
        <h2 className="mb-4 font-display text-lg text-text">My favorites</h2>
        {favorites.length === 0 ? (
          <p className="text-sm text-text-muted">You haven&apos;t favorited any recipes yet.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {favorites.map(({ recipe }) => (
              <RecipeCard
                key={recipe.id}
                id={recipe.id}
                title={recipe.title}
                category={recipe.category}
                photoUrl={recipe.photoUrl}
                submitterName={recipe.submitterName}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
