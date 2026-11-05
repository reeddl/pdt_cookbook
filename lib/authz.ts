import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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
  if (session.user.role !== "ADMIN") {
    throw new Error("Not authorized: admin only");
  }
  return session;
}
