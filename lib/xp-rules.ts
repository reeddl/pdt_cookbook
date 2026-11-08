import type { XpKind } from "@prisma/client";

/** XP per action. Change a number here and new awards use it; history is untouched. */
export const XP_POINTS = {
  DAILY_LOGIN: 5,
  COMMENT: 3,
  LIKE_GIVEN: 1,
  LIKE_RECEIVED: 3,
  RECIPE_PUBLISHED: 30,
} as const satisfies Record<XpKind, number>;

/**
 * Comment anti-spam. Comments always post; they only *earn XP* when they are:
 *  - substantive (length and word count),
 *  - on someone else's recipe,
 *  - the first XP comment from you on that recipe, and
 *  - within the rolling 24h cap.
 * Staff deleting a comment also takes its XP back (see revokeCommentXp).
 */
export const COMMENT_XP_RULES = {
  minLength: 20,
  minWords: 4,
  maxPerDay: 3,
} as const;
