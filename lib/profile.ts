import { prisma } from "@/lib/prisma";
import { foodieScore, type FoodieScoreParts } from "@/lib/foodieScore";

export interface MemberProfile {
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    bondNumber: string | null;
    pledgeClass: string | null;
    graduationYear: number | null;
  };
  recipes: {
    id: string;
    title: string;
    category: string;
    photoUrl: string | null;
    submitterName: string;
    submittedById: string | null;
    status: "PENDING" | "PUBLISHED" | "REJECTED";
  }[];
  parts: FoodieScoreParts;
  score: number;
}

/**
 * Everything the profile pages show about one member.
 *
 * `includeUnpublished` is for someone viewing their own profile — they see
 * their pending and rejected submissions; everyone else sees only what's live.
 */
export async function getMemberProfile(
  userId: string,
  { includeUnpublished = false }: { includeUnpublished?: boolean } = {}
): Promise<MemberProfile | null> {
  const user = await prisma.user.findFirst({
    // Rejected accounts have no profile page.
    where: { id: userId, NOT: { status: "REJECTED" } },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      bondNumber: true,
      pledgeClass: true,
      graduationYear: true,
    },
  });

  if (!user) return null;

  const [recipes, commentsWritten, favoritesReceived, recipesPublished] = await Promise.all([
    prisma.recipe.findMany({
      where: {
        submittedById: userId,
        ...(includeUnpublished ? {} : { status: "PUBLISHED" }),
      },
      select: {
        id: true,
        title: true,
        category: true,
        photoUrl: true,
        submitterName: true,
        submittedById: true,
        status: true,
      },
      orderBy: [{ status: "asc" }, { title: "asc" }],
    }),
    prisma.comment.count({ where: { userId } }),
    prisma.favorite.count({
      where: { recipe: { submittedById: userId, status: "PUBLISHED" } },
    }),
    prisma.recipe.count({ where: { submittedById: userId, status: "PUBLISHED" } }),
  ]);

  const parts: FoodieScoreParts = { recipesPublished, favoritesReceived, commentsWritten };

  return { user, recipes, parts, score: foodieScore(parts) };
}
