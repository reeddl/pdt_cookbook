import type { RecipeStatus, UserRole } from "@prisma/client";

/**
 * Who may edit a recipe after it's been submitted: the member who submitted it,
 * and admins (who already manage the whole catalog). Moderators review
 * submissions but don't edit other people's recipes, same as before.
 *
 * Kept free of auth/Prisma imports so it can be unit tested and shared by the
 * page (to show the Edit button) and the server action (to enforce it).
 */
export function canEditRecipe(
  user: { id: string; role: UserRole; status: string } | null | undefined,
  recipe: { submittedById: string | null; status: RecipeStatus }
): boolean {
  if (!user || user.status !== "APPROVED") return false;
  if (!EDITABLE_STATUSES.includes(recipe.status)) return false;
  if (user.role === "ADMIN") return true;
  return recipe.submittedById !== null && recipe.submittedById === user.id;
}

/**
 * Published and pending recipes are edited in place: a published one stays
 * published and a pending one stays in the review queue. Rejected recipes keep
 * their own "edit and resubmit" flow, which sends them back for review.
 */
export const EDITABLE_STATUSES: RecipeStatus[] = ["PUBLISHED", "PENDING"];

/**
 * Who may open a recipe's page. Published recipes are open to every member.
 * A recipe awaiting review is shown as a preview of its live page to the
 * reviewers (admins and moderators) and to its own author. Rejected recipes
 * have no page; their author fixes them from the edit form.
 */
export function canViewRecipe(
  user: { id: string; role: UserRole; status: string } | null | undefined,
  recipe: { submittedById: string | null; status: RecipeStatus }
): boolean {
  if (recipe.status === "PUBLISHED") return true;
  if (recipe.status !== "PENDING" || !user || user.status !== "APPROVED") return false;
  if (user.role === "ADMIN" || user.role === "MODERATOR") return true;
  return recipe.submittedById !== null && recipe.submittedById === user.id;
}
