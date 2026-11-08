import { prisma } from "@/lib/prisma";
import { getXpSummary, type XpBreakdownRow } from "@/lib/xp";

export interface MemberProfile {
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    bondNumber: string | null;
    pledgeClass: string | null;
    graduationYear: number | null;
    xp: number;
  };
  recipes: {
    id: string;
    title: string;
    category: string;
    photoUrl: string | null;
    submitterName: string;
    submittedById: string | null;
    status: "PENDING" | "PUBLISHED" | "REJECTED";
    /** Only ever populated for the member's own profile. */
    rejectionReason: string | null;
  }[];
  breakdown: XpBreakdownRow[];
  badges: string[];
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
      xp: true,
    },
  });

  if (!user) return null;

  const [recipes, { breakdown, badges }] = await Promise.all([
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
        rejectionReason: includeUnpublished,
      },
      orderBy: [{ status: "asc" }, { title: "asc" }],
    }),
    getXpSummary(userId),
  ]);

  return { user, recipes, breakdown, badges: badges.map((b) => b.badgeKey) };
}
