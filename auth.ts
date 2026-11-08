import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { UserRole, UserStatus } from "@prisma/client";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: {
    ...PrismaAdapter(prisma),
    // The default createUser writes `image`/`emailVerified`, which this schema
    // doesn't have (it uses `avatarUrl` and has no email verification). Map them
    // here instead of in the `signIn` callback — that callback runs *before* the
    // adapter's own account-linking step, so creating the user there caused
    // Auth.js to see an "existing" user with no linked Account and throw
    // OAuthAccountNotLinked on every first-time sign-in.
    async createUser({ id, image, emailVerified, ...data }) {
      const isAdminEmail = data.email === process.env.ADMIN_EMAIL;
      const user = await prisma.user.create({
        data: {
          ...data,
          name: data.name ?? data.email,
          avatarUrl: image ?? null,
          // New sign-ups start PENDING: they can browse the cookbook view-only
          // until an admin confirms them (then they get a full profile).
          status: isAdminEmail ? UserStatus.APPROVED : UserStatus.PENDING,
          role: isAdminEmail ? UserRole.ADMIN : UserRole.MEMBER,
        },
      });
      return { ...user, image: user.avatarUrl, emailVerified: null };
    },
  },
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

      // Safety net for an existing user whose email later becomes ADMIN_EMAIL —
      // first-time creation already sets status/role via adapter.createUser above.
      if (isAdminEmail) {
        await prisma.user.updateMany({
          where: { email: user.email, NOT: { status: "APPROVED", role: "ADMIN" } },
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
