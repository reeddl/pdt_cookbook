import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";

export default async function AdminDashboardPage() {
  const [pendingUsers, pendingRecipes, totalRecipes, totalMembers] = await Promise.all([
    prisma.user.count({ where: { status: "PENDING" } }),
    prisma.recipe.count({ where: { status: "PENDING" } }),
    prisma.recipe.count({ where: { status: "PUBLISHED" } }),
    prisma.user.count({ where: { status: "APPROVED" } }),
  ]);

  const stats = [
    { label: "Pending member approvals", value: pendingUsers, href: "/admin/users" },
    { label: "Pending recipe submissions", value: pendingRecipes, href: "/admin/recipes/pending" },
    { label: "Published recipes", value: totalRecipes, href: "/admin/recipes" },
    { label: "Approved members", value: totalMembers, href: "/admin/users" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {stats.map((stat) => (
        <Link key={stat.label} href={stat.href}>
          <Card className="p-6 transition-shadow hover:shadow-md">
            <p className="text-3xl font-semibold text-text-primary">{stat.value}</p>
            <p className="mt-1 text-body-regular text-text-secondary">{stat.label}</p>
          </Card>
        </Link>
      ))}
    </div>
  );
}
