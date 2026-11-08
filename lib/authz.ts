import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** ADMIN and MODERATOR are "staff": they can use the review/moderation tools. */
export function isStaff(role: UserRole | undefined): boolean {
  return role === "ADMIN" || role === "MODERATOR";
}

export function isAdmin(role: UserRole | undefined): boolean {
  return role === "ADMIN";
}

/** Signed in at all (includes view-only PENDING members). Never use for writes. */
export async function requireSession() {
  const session = await auth();
  if (!session) {
    throw new Error("Not authorized: sign-in required");
  }
  return session;
}

/** Signed in AND confirmed by an admin. Every write goes through this. */
export async function requireAuth() {
  const session = await requireSession();
  if (session.user.status !== "APPROVED") {
    throw new Error("Not authorized: your account is awaiting confirmation");
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
  if (session.user.role !== "ADMIN") {
    throw new Error("Not authorized: admin only");
  }
  return session;
}

/** Recipe review and comment moderation: admins and moderators. */
export async function requireStaff() {
  const session = await requireAuth();
  if (!isStaff(session.user.role)) {
    throw new Error("Not authorized: staff only");
  }
  return session;
}

/** Page-level guard for admin-only screens (members, recipe catalog editing). */
export async function requireAdminPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!isAdmin(session.user.role)) redirect("/admin");
  return session;
}
