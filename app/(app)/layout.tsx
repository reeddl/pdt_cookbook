import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { Button } from "@/components/ui/button";
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
        <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-3">
          <Link href="/recipes" className="font-display text-lg text-text">
            PDT Cookbook
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/recipes/submit" className="text-text hover:text-accent">
              Suggest a recipe
            </Link>
            <Link href="/profile" className="text-text hover:text-accent">
              {session.user.name}
            </Link>
            {session.user.role === "ADMIN" && (
              <Link href="/admin" className="text-text hover:text-accent">
                Admin
              </Link>
            )}
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <Button type="submit" variant="ghost">
                Sign out
              </Button>
            </form>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto px-8 py-8">
          <div className="mx-auto max-w-[880px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
