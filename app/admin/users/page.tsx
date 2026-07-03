import { prisma } from "@/lib/prisma";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { approveUser, rejectUser } from "./actions";

export default async function AdminUsersPage() {
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
        <h2 className="mb-3 font-display text-xl text-text">Pending approvals</h2>
        {pending.length === 0 ? (
          <p className="text-sm text-text-muted">No accounts waiting for approval.</p>
        ) : (
          <div className="space-y-3">
            {pending.map((user) => (
              <Card key={user.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-text">{user.name}</p>
                  <p className="text-sm text-text-muted">{user.email}</p>
                </div>
                <div className="flex gap-2">
                  <form action={approveUser.bind(null, user.id)}>
                    <Button type="submit" variant="primary">
                      Approve
                    </Button>
                  </form>
                  <form action={rejectUser.bind(null, user.id)}>
                    <Button type="submit" variant="danger">
                      Reject
                    </Button>
                  </form>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl text-text">Roster</h2>
        <div className="space-y-2">
          {roster.map((user) => (
            <Card key={user.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium text-text">{user.name}</p>
                <p className="text-sm text-text-muted">{user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge>{user.role}</Badge>
                <Badge className={user.status === "REJECTED" ? "bg-danger/10 text-danger" : ""}>
                  {user.status}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
