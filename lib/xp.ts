import type { Prisma, XpKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { COMMENT_XP_RULES, XP_POINTS } from "@/lib/xp-rules";
import { earnedBadgeKeys, type BadgeStats } from "@/lib/badges";

const DAY_MS = 24 * 60 * 60 * 1000;

type Db = Prisma.TransactionClient | typeof prisma;

/**
 * Record an XP award. Idempotent on (user, kind, refKey): a repeat is a no-op.
 * Ledger row and cached User.xp change together in one transaction.
 */
async function grantXp(input: {
  userId: string;
  kind: XpKind;
  refKey: string;
  recipeId?: string;
}): Promise<boolean> {
  const points = XP_POINTS[input.kind];
  const granted = await prisma.$transaction(async (tx) => {
    const { count } = await tx.xpEvent.createMany({
      data: [{ ...input, points }],
      skipDuplicates: true,
    });
    if (count === 0) return false;
    await tx.user.update({ where: { id: input.userId }, data: { xp: { increment: points } } });
    return true;
  });
  if (granted) await syncBadges(input.userId);
  return granted;
}

/** Calendar day in the chapter's timezone, e.g. "2026-11-08". */
function dayKey(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(date);
}

export async function awardDailyLogin(userId: string) {
  return grantXp({ userId, kind: "DAILY_LOGIN", refKey: dayKey() });
}

export async function awardRecipePublished(recipe: { id: string; submittedById: string | null }) {
  if (!recipe.submittedById) return false;
  return grantXp({
    userId: recipe.submittedById,
    kind: "RECIPE_PUBLISHED",
    refKey: recipe.id,
    recipeId: recipe.id,
  });
}

/** Liking pays the liker a little and the author more. Never for your own recipe. */
export async function awardLike(input: {
  likerId: string;
  recipe: { id: string; submittedById: string | null };
}) {
  const { likerId, recipe } = input;
  if (recipe.submittedById === likerId) return;
  await grantXp({ userId: likerId, kind: "LIKE_GIVEN", refKey: recipe.id, recipeId: recipe.id });
  if (recipe.submittedById) {
    // Keyed by liker, so each member can pay a given recipe's author once —
    // un-liking and re-liking never earns again.
    await grantXp({
      userId: recipe.submittedById,
      kind: "LIKE_RECEIVED",
      refKey: `${likerId}:${recipe.id}`,
      recipeId: recipe.id,
    });
  }
}

export function isSubstantiveComment(body: string): boolean {
  const text = body.trim();
  return (
    text.length >= COMMENT_XP_RULES.minLength &&
    text.split(/\s+/).length >= COMMENT_XP_RULES.minWords
  );
}

export async function awardComment(input: {
  userId: string;
  commentId: string;
  body: string;
  recipe: { id: string; submittedById: string | null };
}) {
  const { userId, commentId, body, recipe } = input;
  if (recipe.submittedById === userId || !isSubstantiveComment(body)) return false;

  const [alreadyOnRecipe, recentCount] = await Promise.all([
    prisma.xpEvent.findFirst({ where: { userId, kind: "COMMENT", recipeId: recipe.id }, select: { id: true } }),
    prisma.xpEvent.count({
      where: { userId, kind: "COMMENT", createdAt: { gte: new Date(Date.now() - DAY_MS) } },
    }),
  ]);
  if (alreadyOnRecipe || recentCount >= COMMENT_XP_RULES.maxPerDay) return false;

  return grantXp({ userId, kind: "COMMENT", refKey: commentId, recipeId: recipe.id });
}

/** A moderator removed a comment: take back any XP it earned. */
export async function revokeCommentXp(commentId: string) {
  const event = await prisma.xpEvent.findFirst({ where: { kind: "COMMENT", refKey: commentId } });
  if (!event) return;
  await prisma.$transaction([
    prisma.xpEvent.delete({ where: { id: event.id } }),
    prisma.user.update({ where: { id: event.userId }, data: { xp: { decrement: event.points } } }),
  ]);
}

export interface XpBreakdownRow {
  kind: XpKind;
  count: number;
  points: number;
}

async function ledgerTotals(userId: string, db: Db = prisma): Promise<XpBreakdownRow[]> {
  const rows = await db.xpEvent.groupBy({
    by: ["kind"],
    where: { userId },
    _count: { _all: true },
    _sum: { points: true },
  });
  return rows.map((r) => ({ kind: r.kind, count: r._count._all, points: r._sum.points ?? 0 }));
}

export function badgeStatsFrom(rows: XpBreakdownRow[]): BadgeStats {
  const count = (kind: XpKind) => rows.find((r) => r.kind === kind)?.count ?? 0;
  return {
    recipesPublished: count("RECIPE_PUBLISHED"),
    likesReceived: count("LIKE_RECEIVED"),
    likesGiven: count("LIKE_GIVEN"),
    commentsWritten: count("COMMENT"),
    loginDays: count("DAILY_LOGIN"),
  };
}

/** Grant any badges the member now qualifies for. Safe to call any time. */
export async function syncBadges(userId: string, rows?: XpBreakdownRow[]) {
  const totals = rows ?? (await ledgerTotals(userId));
  const earned = earnedBadgeKeys(badgeStatsFrom(totals));
  if (earned.length === 0) return;
  await prisma.userBadge.createMany({
    data: earned.map((badgeKey) => ({ userId, badgeKey })),
    skipDuplicates: true,
  });
}

/** Everything a profile needs about XP: the ledger breakdown and earned badge keys. */
export async function getXpSummary(userId: string) {
  const breakdown = await ledgerTotals(userId);
  await syncBadges(userId, breakdown);
  const badges = await prisma.userBadge.findMany({
    where: { userId },
    select: { badgeKey: true, awardedAt: true },
  });
  return { breakdown, badges };
}
