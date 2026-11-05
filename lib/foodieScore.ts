/**
 * Foodie score — a single number summarising how much someone has contributed
 * to the cookbook.
 *
 * PLACEHOLDER FORMULA: the weights below are a first guess, kept in one place
 * so they're cheap to change once we settle on what the score should reward.
 */
export const FOODIE_SCORE_WEIGHTS = {
  /** A recipe of theirs that made it into the cookbook. */
  recipePublished: 10,
  /** Someone else favouriting one of their recipes. */
  favoriteReceived: 3,
  /** A comment they left on any recipe. */
  commentWritten: 2,
} as const;

export interface FoodieScoreParts {
  recipesPublished: number;
  favoritesReceived: number;
  commentsWritten: number;
}

export function foodieScore(parts: FoodieScoreParts): number {
  return (
    parts.recipesPublished * FOODIE_SCORE_WEIGHTS.recipePublished +
    parts.favoritesReceived * FOODIE_SCORE_WEIGHTS.favoriteReceived +
    parts.commentsWritten * FOODIE_SCORE_WEIGHTS.commentWritten
  );
}

/** Flavour label for the score, shown under the number. */
export function foodieRank(score: number): string {
  if (score >= 150) return "Head chef";
  if (score >= 80) return "Sous chef";
  if (score >= 40) return "Line cook";
  if (score >= 15) return "Prep cook";
  if (score > 0) return "Dishwasher";
  return "Not in the kitchen yet";
}
