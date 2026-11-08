import type { UserRole } from "@prisma/client";

/**
 * "View as" — lets a real admin see (and use) the site as a lower role.
 *
 * The choice lives in a cookie. It can only ever *lower* the effective role of
 * a real ADMIN: for everyone else the cookie is ignored, and it can't name a
 * role above MODERATOR, so forging it grants nothing. Pure and dependency-free
 * so it is safe to use from `proxy.ts`.
 */
export const VIEW_AS_COOKIE = "pdt_view_as";

export const VIEW_AS_ROLES = ["MEMBER", "MODERATOR"] as const;
export type ViewAsRole = (typeof VIEW_AS_ROLES)[number];

export function parseViewAs(value: string | undefined | null): ViewAsRole | null {
  return VIEW_AS_ROLES.find((r) => r === value) ?? null;
}

export interface ResolvedRole {
  /** The role the site should behave as right now. */
  role: UserRole | undefined;
  /** The account's actual role. */
  realRole: UserRole | undefined;
  /** Set only while an admin is previewing a lower role. */
  previewing: ViewAsRole | null;
}

export function resolveRole(
  realRole: UserRole | undefined,
  cookieValue: string | undefined | null
): ResolvedRole {
  const requested = parseViewAs(cookieValue);
  if (realRole === "ADMIN" && requested) {
    return { role: requested, realRole, previewing: requested };
  }
  return { role: realRole, realRole, previewing: null };
}
