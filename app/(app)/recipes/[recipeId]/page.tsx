import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/card";

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ recipeId: string }>;
}) {
  const { recipeId } = await params;
  const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } });

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
      <h1 className="mt-3 font-display text-3xl text-text">{recipe.title}</h1>
      <p className="mt-1 text-sm text-text-muted">Submitted by {recipe.submitterName}</p>

      <div className="mt-8 grid gap-8 sm:grid-cols-[1fr_2fr]">
        <section>
          <h2 className="mb-2 font-display text-lg text-text">Ingredients</h2>
          <ul className="space-y-1 text-sm text-text">
            {recipe.ingredients.split("\n").filter(Boolean).map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="mb-2 font-display text-lg text-text">Instructions</h2>
          <p className="whitespace-pre-line text-sm text-text">{recipe.instructions}</p>
        </section>
      </div>
    </article>
  );
}
