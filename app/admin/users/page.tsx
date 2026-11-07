import { requireAdminPage } from "@/lib/authz";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { approveUser, rejectUser } from "./actions";

export default async function AdminUsersPage() {
  await requireAdminPage();
  const [pending, roster] = await Promise.all([
    prisma.user.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.findMany({
      where: { status: { in: ["APPROVED", "REJECTED"] } },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-10">
      <section>
        <h2 className="mb-3 text-title-2-semibold text-text-primary">Pending approvals</h2>
        {pending.length === 0 ? (
          <p className="text-body-regular text-text-secondary">No accounts waiting for approval.</p>
        ) : (
          <div className="space-y-3">
            {pending.map((user) => (
              <Card key={user.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-text-primary">{user.name}</p>
                  <p className="text-body-regular text-text-secondary">{user.email}</p>
                </div>
                <div className="flex gap-2">
                  <form action={approveUser.bind(null, user.id)}>
                    <SubmitButton variant="primary" pendingLabel="Approving…">
                      Approve
                    </SubmitButton>
                  </form>
                  <form action={rejectUser.bind(null, user.id)}>
                    <SubmitButton variant="danger" pendingLabel="Rejecting…">
                      Reject
                    </SubmitButton>
                  </form>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-title-2-semibold text-text-primary">Roster</h2>
        <div className="space-y-2">
          {roster.map((user) => (
            <Card key={user.id} className="flex items-center justify-between p-4">
              <div>
                <Link
                  href={`/profile/${user.id}`}
                  className="font-medium text-text-primary hover:text-button-ghost-foreground hover:underline"
                >
                  {user.name}
                </Link>
                <p className="text-body-regular text-text-secondary">{user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge>{user.role}</Badge>
                <Badge className={user.status === "REJECTED" ? "bg-background-tertiary-error text-text-error-primary" : ""}>
                  {user.status}
                </Badge>
                <Link href={`/admin/users/${user.id}/edit`}>
                  <Button variant="secondary">Edit</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
