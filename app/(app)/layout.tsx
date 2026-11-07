import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { ShieldLogo } from "@/components/brand/ShieldLogo";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { ThemeToggle } from "@/components/application/theme/theme-toggle";
import { SubmitButton } from "@/components/ui/submit-button";
import { isStaff } from "@/lib/authz";
import { getSidebarRecipes } from "@/lib/recipes";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.status !== "APPROVED") redirect("/pending");

  const recipes = await getSidebarRecipes();

  return (
    <div className="flex min-h-screen">
      <Sidebar recipes={recipes} />
      <div className="flex flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-separator-border bg-background-primary-default py-3 pr-4 pl-20 sm:pl-6 sm:pr-6">
          <Link href="/recipes" className="flex items-center gap-2.5 text-title-3-semibold text-text-primary">
            <ShieldLogo height={30} preload />
            PDT Cookbook
          </Link>
          <div className="flex flex-wrap items-center gap-4 text-body-regular">
            <Link href="/recipes/submit" className="text-text-secondary transition-colors hover:text-text-primary">
              Suggest a recipe
            </Link>
            <Link href="/profile" className="text-text-secondary transition-colors hover:text-text-primary">
              {session.user.name}
            </Link>
            {isStaff(session.user.role) && (
              <Link href="/admin" className="text-text-secondary transition-colors hover:text-text-primary">
                {session.user.role === "ADMIN" ? "Admin" : "Moderation"}
              </Link>
            )}
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
          <div className="mx-auto max-w-[880px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
