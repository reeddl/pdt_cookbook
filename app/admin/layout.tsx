import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAdmin, isStaff } from "@/lib/authz";
import { ShieldLogo } from "@/components/brand/ShieldLogo";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user.status !== "APPROVED") redirect("/pending");
  if (!isStaff(session.user.role)) redirect("/recipes");
  const admin = isAdmin(session.user.role);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-8">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldLogo height={38} preload />
          <div>
            <h1 className="text-title-1-semibold text-text-primary">{admin ? "Admin" : "Moderation"}</h1>
            <p className="text-body-regular text-text-secondary">
              {admin ? "Manage members and the recipe catalog" : "Review recipe submissions and moderate comments"}
            </p>
          </div>
        </div>
        <Link href="/recipes" className="text-body-regular text-button-ghost-foreground hover:underline">
          Back to cookbook
        </Link>
      </header>
      <nav className="mb-8 flex flex-wrap gap-4 border-b border-separator-border pb-3 text-body-regular">
        <Link href="/admin" className="text-text-primary hover:text-button-ghost-foreground">
          Overview
        </Link>
        {admin && (
          <>
            <Link href="/admin/users" className="text-text-primary hover:text-button-ghost-foreground">
          Members
        </Link>
            <Link href="/admin/recipes" className="text-text-primary hover:text-button-ghost-foreground">
          Recipes
        </Link>
          </>
        )}
        <Link href="/admin/recipes/pending" className="text-text-primary hover:text-button-ghost-foreground">
          Pending recipes
        </Link>
        <Link href="/admin/comments" className="text-text-primary hover:text-button-ghost-foreground">
          Comments
        </Link>
        {admin && <Link href="/admin/recipes/new" className="text-text-primary hover:text-button-ghost-foreground">
          New recipe
        </Link>}
      </nav>
      {children}
    </div>
  );
}
