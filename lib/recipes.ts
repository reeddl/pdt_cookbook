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
