import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { isProfileComplete, isStaff } from "@/lib/authz";
import { Badge } from "@/components/ui/card";
import { LevelBadge } from "@/components/level/LevelBadge";
import { LikeButton } from "@/components/likes/LikeButton";
import { CommentThread } from "@/components/comments/CommentThread";

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ recipeId: string }>;
}) {
  const { recipeId } = await params;
  const session = await auth();

  const [recipe, comments, like, likeCount, canComment] = await Promise.all([
    prisma.recipe.findUnique({
      where: { id: recipeId },
      include: { submittedBy: { select: { xp: true } } },
    }),
    prisma.comment.findMany({
      where: { recipeId },
      include: { user: { select: { id: true, name: true, avatarUrl: true, xp: true } } },
      orderBy: { createdAt: "asc" },
    }),
    session
      ? prisma.like.findUnique({
          where: { userId_recipeId: { userId: session.user.id, recipeId } },
        })
      : null,
    prisma.like.count({ where: { recipeId } }),
    session ? isProfileComplete(session.user.id) : false,
  ]);

  if (!recipe || recipe.status !== "PUBLISHED") notFound();

  return (
    <article>
      {recipe.photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={recipe.photoUrl}
          alt={recipe.title}
          className="mb-6 h-72 w-full rounded-3xl object-cover"
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
          <h1 className="text-title-1-semibold text-text-primary">{recipe.title}</h1>
          <p className="mt-1 text-body-regular text-text-secondary">
            Submitted by{" "}
            {recipe.submittedById ? (
              <Link
                href={`/profile/${recipe.submittedById}`}
                className="text-button-ghost-foreground hover:underline"
              >
                {recipe.submitterName}
              </Link>
            ) : (
              recipe.submitterName
            )}
            {recipe.submittedBy && <LevelBadge xp={recipe.submittedBy.xp} className="ml-1.5" />}
          </p>
        </div>
        <LikeButton recipeId={recipe.id} isLiked={Boolean(like)} likeCount={likeCount} />
      </div>

      <div className="mt-8 grid gap-8 sm:grid-cols-[1fr_2fr]">
        <section>
          <h2 className="mb-2 text-title-3-semibold text-text-primary">Ingredients</h2>
          <ul className="space-y-1 text-body-regular text-text-primary">
            {recipe.ingredients
              .split("\n")
              .filter(Boolean)
              .map((line, i) => (
                <li key={i}>{line}</li>
              ))}
          </ul>
        </section>
        <section>
          <h2 className="mb-2 text-title-3-semibold text-text-primary">Instructions</h2>
          <p className="whitespace-pre-line text-body-regular text-text-primary">{recipe.instructions}</p>
        </section>
      </div>

      <CommentThread
        recipeId={recipe.id}
        comments={comments} canComment={canComment}
        canModerate={isStaff(session?.user.role)}
      />
    </article>
  );
}
