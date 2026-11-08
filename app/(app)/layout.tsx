import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { ShieldLogo } from "@/components/brand/ShieldLogo";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { ThemeToggle } from "@/components/application/theme/theme-toggle";
import { SubmitButton } from "@/components/ui/submit-button";
import { LevelBadge } from "@/components/level/LevelBadge";
import { getViewState, isStaff } from "@/lib/authz";
import { PreviewBanner } from "@/components/admin/PreviewBanner";
import { ViewAsSwitcher } from "@/components/admin/ViewAsSwitcher";
import { prisma } from "@/lib/prisma";
import { awardDailyLogin } from "@/lib/xp";
import { getSidebarRecipes } from "@/lib/recipes";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.status !== "APPROVED") redirect("/pending");

  const view = await getViewState(session);

  // Daily login XP: idempotent per calendar day, and must never block the page.
  await awardDailyLogin(session.user.id).catch((error) => {
    console.error("Daily login XP failed", error);
  });

  const [recipes, me, sentBack] = await Promise.all([
    getSidebarRecipes(),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { xp: true } }),
    prisma.recipe.count({ where: { submittedById: session.user.id, status: "REJECTED" } }),
  ]);

  return (
    <div className="flex min-h-screen">
      <Sidebar recipes={recipes} />
      <div className="flex flex-1 flex-col">
        {view.previewing && <PreviewBanner role={view.previewing} name={session.user.name ?? "you"} />}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-separator-border bg-background-primary-default py-3 pr-4 pl-20 sm:pl-6 sm:pr-6">
          <Link href="/recipes" className="flex items-center gap-2.5 text-title-3-semibold text-text-primary">
            <ShieldLogo height={30} preload />
            PDT Cookbook
          </Link>
          <div className="flex flex-wrap items-center gap-4 text-body-regular">
            <Link href="/recipes/submit" className="text-text-secondary transition-colors hover:text-text-primary">
              Suggest a recipe
            </Link>
            <Link href="/likes" className="text-text-secondary transition-colors hover:text-text-primary">
              Liked
            </Link>
            <Link href="/profile" className="flex items-center gap-1.5 text-text-secondary transition-colors hover:text-text-primary">
              {session.user.name}
              {me && <LevelBadge xp={me.xp} />}
            </Link>
            {isStaff(view.role) && (
              <Link href="/admin" className="text-text-secondary transition-colors hover:text-text-primary">
                {view.role === "ADMIN" ? "Admin" : "Moderation"}
              </Link>
            )}
            {view.realRole === "ADMIN" && !view.previewing && <ViewAsSwitcher />}
            <ThemeToggle appearance="segmented" size="small" />
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <SubmitButton variant="ghost" pendingLabel="Signing out…">
                Sign out
              </SubmitButton>
            </form>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-8">
          <div className="mx-auto max-w-[880px]">
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
  );
}
