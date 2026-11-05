import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Badge } from "@/components/ui/card";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";
import { CommentThread } from "@/components/comments/CommentThread";

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ recipeId: string }>;
}) {
  const { recipeId } = await params;
  const session = await auth();

  const [recipe, comments, favorite] = await Promise.all([
    prisma.recipe.findUnique({ where: { id: recipeId } }),
    prisma.comment.findMany({
      where: { recipeId },
      include: { user: { select: { name: true, avatarUrl: true } } },
      orderBy: { createdAt: "asc" },
    }),
    session
      ? prisma.favorite.findUnique({
          where: { userId_recipeId: { userId: session.user.id, recipeId } },
        })
      : null,
  ]);

  if (!recipe || recipe.status !== "PUBLISHED") notFound();

  return (
    <article>
      {recipe.photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={recipe.photoUrl}
          alt={recipe.title}
          className="mb-6 h-72 w-full rounded-xl object-cover"
        />
      )}
      <div className="flex items-center gap-2">
        <Badge>{recipe.category}</Badge>
        {recipe.tags.map((tag) => (
          <Badge key={tag}>{tag}</Badge>
        ))}
      </div>

      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-text">{recipe.title}</h1>
          <p className="mt-1 text-sm text-text-muted">Submitted by {recipe.submitterName}</p>
        </div>
        <FavoriteButton recipeId={recipe.id} isFavorited={Boolean(favorite)} />
      </div>

      <div className="mt-8 grid gap-8 sm:grid-cols-[1fr_2fr]">
        <section>
          <h2 className="mb-2 font-display text-lg text-text">Ingredients</h2>
          <ul className="space-y-1 text-sm text-text">
            {recipe.ingredients
              .split("\n")
              .filter(Boolean)
              .map((line, i) => (
                <li key={i}>{line}</li>
              ))}
          </ul>
        </section>
        <section>
          <h2 className="mb-2 font-display text-lg text-text">Instructions</h2>
          <p className="whitespace-pre-line text-sm text-text">{recipe.instructions}</p>
        </section>
      </div>

      <CommentThread recipeId={recipe.id} comments={comments} />
    </article>
  );
}
