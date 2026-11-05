import { prisma } from "@/lib/prisma";

export function getSidebarRecipes() {
  return prisma.recipe.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true, title: true, category: true },
    orderBy: [{ category: "asc" }, { title: "asc" }],
  });
}

export function getPublishedRecipes() {
  return prisma.recipe.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ category: "asc" }, { title: "asc" }],
  });
}

/** Every tag already in use, most common first — suggestions for the tag input. */
export async function getTagSuggestions(): Promise<string[]> {
  const recipes = await prisma.recipe.findMany({ select: { tags: true } });

  const counts = new Map<string, { label: string; count: number }>();
  for (const tag of recipes.flatMap((r) => r.tags)) {
    const key = tag.toLowerCase();
    const entry = counts.get(key);
    if (entry) entry.count += 1;
    else counts.set(key, { label: tag, count: 1 });
  }

  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .map((entry) => entry.label);
}
