import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { resolveRole, VIEW_AS_COOKIE } from "@/lib/viewAs";

/** ADMIN and MODERATOR are "staff": they can use the review/moderation tools. */
export function isStaff(role: UserRole | undefined): boolean {
  return role === "ADMIN" || role === "MODERATOR";
}

export function isAdmin(role: UserRole | undefined): boolean {
  return role === "ADMIN";
}

/**
 * The role the site should act as for this session: the real role, unless an
 * admin is previewing a lower one (see lib/viewAs.ts). Use this — not
 * `session.user.role` — for anything that gates what a user can see or do.
 */
export async function getViewState(session: { user: { role: UserRole } } | null | undefined) {
  const jar = await cookies();
  return resolveRole(session?.user.role, jar.get(VIEW_AS_COOKIE)?.value);
}

export async function getEffectiveRole(session: { user: { role: UserRole } } | null | undefined) {
  return (await getViewState(session)).role;
}

export async function requireAuth() {
  const session = await auth();
  if (!session) {
    throw new Error("Not authorized: sign-in required");
  }
  return session;
}

export async function isProfileComplete(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { bondNumber: true, pledgeClass: true, graduationYear: true },
  });
  return Boolean(user?.bondNumber && user?.pledgeClass && user?.graduationYear);
}

export async function requireProfileComplete() {
  const session = await requireAuth();
  if (!(await isProfileComplete(session.user.id))) {
    throw new Error(
      "Add your bond number, pledge class, and graduation year to your profile before posting"
    );
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();
  if ((await getEffectiveRole(session)) !== "ADMIN") {
    throw new Error("Not authorized: admin only");
  }
  return session;
}

/** Recipe review and comment moderation: admins and moderators. */
export async function requireStaff() {
  const session = await requireAuth();
  if (!isStaff(await getEffectiveRole(session))) {
    throw new Error("Not authorized: staff only");
  }
  return session;
}

/** Page-level guard for admin-only screens (members, recipe catalog editing). */
export async function requireAdminPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!isAdmin(await getEffectiveRole(session))) redirect("/admin");
  return session;
}
