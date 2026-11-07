import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/authz";
import { daysAgo } from "@/lib/dates";
import { Card } from "@/components/ui/card";

export default async function AdminDashboardPage() {
  const session = await auth();
  const admin = isAdmin(session?.user.role);
  const weekAgo = daysAgo(7);

  const [pendingUsers, pendingRecipes, totalRecipes, totalMembers, recentComments] =
    await Promise.all([
      admin ? prisma.user.count({ where: { status: "PENDING" } }) : 0,
      prisma.recipe.count({ where: { status: "PENDING" } }),
      prisma.recipe.count({ where: { status: "PUBLISHED" } }),
      admin ? prisma.user.count({ where: { status: "APPROVED" } }) : 0,
      prisma.comment.count({ where: { createdAt: { gte: weekAgo } } }),
    ]);

  const stats = [
    ...(admin
      ? [{ label: "Pending member approvals", value: pendingUsers, href: "/admin/users" }]
      : []),
    { label: "Pending recipe submissions", value: pendingRecipes, href: "/admin/recipes/pending" },
    { label: "Comments this week", value: recentComments, href: "/admin/comments" },
    ...(admin
      ? [
          { label: "Published recipes", value: totalRecipes, href: "/admin/recipes" },
          { label: "Approved members", value: totalMembers, href: "/admin/users" },
        ]
      : []),
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
