import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { UserRole, UserStatus } from "@prisma/client";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [Google],
  session: {
    strategy: "jwt",
    maxAge: 60 * 60, // 1 hour — keeps status/role claims from going stale for long after an admin action
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      const isAdminEmail = user.email === process.env.ADMIN_EMAIL;

      const existing = await prisma.user.findUnique({
        where: { email: user.email },
      });

      if (!existing) {
        await prisma.user.create({
          data: {
            email: user.email,
            name: user.name ?? user.email,
            avatarUrl: user.image ?? null,
            status: isAdminEmail ? UserStatus.APPROVED : UserStatus.PENDING,
            role: isAdminEmail ? UserRole.ADMIN : UserRole.MEMBER,
          },
        });
      } else if (isAdminEmail && (existing.status !== "APPROVED" || existing.role !== "ADMIN")) {
        await prisma.user.update({
          where: { id: existing.id },
          data: { status: UserStatus.APPROVED, role: UserRole.ADMIN },
        });
      }

      return true;
    },
    async jwt({ token }) {
      if (!token.email) return token;

      const dbUser = await prisma.user.findUnique({
        where: { email: token.email },
      });

      if (dbUser) {
        token.id = dbUser.id;
        token.status = dbUser.status;
        token.role = dbUser.role;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.status = token.status as UserStatus;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
});
