import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user.status !== "APPROVED") redirect("/pending");
  if (session.user.role !== "ADMIN") redirect("/recipes");

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-text">Admin</h1>
          <p className="text-sm text-text-muted">Manage members and the recipe catalog</p>
        </div>
        <Link href="/recipes" className="text-sm text-accent hover:underline">
          Back to cookbook
        </Link>
      </header>
      <nav className="mb-8 flex gap-4 border-b border-border pb-3 text-sm">
        <Link href="/admin" className="text-text hover:text-accent">
          Overview
        </Link>
        <Link href="/admin/users" className="text-text hover:text-accent">
          Members
        </Link>
        <Link href="/admin/recipes" className="text-text hover:text-accent">
          Recipes
        </Link>
        <Link href="/admin/recipes/pending" className="text-text hover:text-accent">
          Pending recipes
        </Link>
        <Link href="/admin/recipes/new" className="text-text hover:text-accent">
          New recipe
        </Link>
      </nav>
      {children}
    </div>
  );
}
