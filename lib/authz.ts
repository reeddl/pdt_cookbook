import { auth } from "@/auth";

export async function requireApproved() {
  const session = await auth();
  if (!session || session.user.status !== "APPROVED") {
    throw new Error("Not authorized: account is not approved");
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireApproved();
  if (session.user.role !== "ADMIN") {
    throw new Error("Not authorized: admin only");
  }
  return session;
}
