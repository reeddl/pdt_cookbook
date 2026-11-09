import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { ShieldLogo } from "@/components/brand/ShieldLogo";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/sidebar/SidebarContext";
import { HeaderMenu } from "@/components/sidebar/HeaderMenu";
import { ThemeToggle } from "@/components/application/theme/theme-toggle";
import { SubmitButton } from "@/components/ui/submit-button";
import { LevelBadge } from "@/components/level/LevelBadge";
import { isStaff } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { awardDailyLogin } from "@/lib/xp";
import { getSidebarRecipes } from "@/lib/recipes";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.status === "REJECTED") redirect("/pending");
  const viewOnly = session.user.status !== "APPROVED";

  // Daily login XP: idempotent per calendar day, and must never block the page.
  if (!viewOnly) {
    await awardDailyLogin(session.user.id).catch((error) => {
      console.error("Daily login XP failed", error);
    });
  }

  const [recipes, me, sentBack] = await Promise.all([
    getSidebarRecipes(),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { xp: true } }),
    prisma.recipe.count({ where: { submittedById: session.user.id, status: "REJECTED" } }),
  ]);

  // On phones the menu stacks these as full-width rows at least 44px tall.
  const navLink =
    "text-text-secondary transition-colors hover:text-text-primary max-sm:flex max-sm:min-h-11 max-sm:items-center";

  return (
    <SidebarProvider>
    <div className="flex min-h-screen">
      <Sidebar recipes={recipes} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="relative flex flex-wrap items-center justify-between gap-3 border-b border-separator-border bg-background-primary-default px-4 py-3 max-sm:sticky max-sm:top-0 max-sm:z-20 max-sm:py-2 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <SidebarTrigger />
            <Link href="/recipes" className="flex min-w-0 items-center gap-2.5 text-title-3-semibold text-text-primary">
              <ShieldLogo height={30} preload />
              <span className="truncate">PDT Cookbook</span>
            </Link>
          </div>
          <HeaderMenu>
            {!viewOnly && (
              <>
                <Link href="/recipes/submit" className={navLink}>
                  Suggest a recipe
                </Link>
                <Link href="/likes" className={navLink}>
                  Liked
                </Link>
                <Link href="/profile" className={`${navLink} gap-1.5 sm:flex sm:items-center`}>
                  {session.user.name}
                  {me && <LevelBadge xp={me.xp} />}
                </Link>
              </>
            )}
            {viewOnly && <span className="text-text-secondary max-sm:flex max-sm:min-h-11 max-sm:items-center">{session.user.name}</span>}
            {isStaff(session.user.role) && (
              <Link href="/admin" className={navLink}>
                {session.user.role === "ADMIN" ? "Admin" : "Moderation"}
              </Link>
            )}
            <div className="max-sm:flex max-sm:min-h-11 max-sm:items-center">
              <ThemeToggle appearance="segmented" size="small" />
            </div>
            <form
              className="max-sm:mt-1"
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <SubmitButton variant="ghost" className="max-sm:h-11 max-sm:w-full" pendingLabel="Signing out…">
                Sign out
              </SubmitButton>
            </form>
          </HeaderMenu>
        </header>
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto max-w-[880px]">
            {viewOnly && (
              <div className="mb-6 rounded-3xl bg-background-secondary-default p-4 text-body-regular text-text-secondary">
                You&apos;re signed in with view-only access. An admin will confirm your account soon —
                then you can like, comment, suggest recipes, and get your full profile.
              </div>
            )}
            {sentBack > 0 && (
              <Link
                href="/profile#needs-attention"
                className="mb-6 block rounded-3xl bg-background-tertiary-error p-4 text-body-regular text-text-error-primary hover:underline"
              >
                {sentBack === 1
                  ? "A recipe you submitted was sent back with feedback."
                  : `${sentBack} recipes you submitted were sent back with feedback.`}{" "}
                Review and resubmit →
              </Link>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
    </SidebarProvider>
  );
}
