import { requireAdminPage } from "@/lib/authz";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { updateMember } from "../../actions";

export default async function EditMemberPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  await requireAdminPage();
  const { userId } = await params;

  const [user, otherMembers] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.user.findMany({
      where: { status: "APPROVED", id: { not: userId } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!user) notFound();

  return (
    <div>
      <h2 className="mb-6 text-title-2-semibold text-text-primary">Edit {user.name}</h2>
      <form action={updateMember.bind(null, user.id)} className="max-w-md space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required defaultValue={user.name} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="bondNumber">Bond number</Label>
            <Input id="bondNumber" name="bondNumber" defaultValue={user.bondNumber ?? ""} />
          </div>
          <div>
            <Label htmlFor="pledgeClass">Pledge class</Label>
            <Input id="pledgeClass" name="pledgeClass" defaultValue={user.pledgeClass ?? ""} />
          </div>
        </div>
        <div>
          <Label htmlFor="graduationYear">Graduation year</Label>
          <Input
            id="graduationYear"
            name="graduationYear"
            type="number"
            defaultValue={user.graduationYear ?? ""}
          />
        </div>
        <div>
          <Label htmlFor="bigId">Big</Label>
          <select
            id="bigId"
            name="bigId"
            defaultValue={user.bigId ?? ""}
            className="w-full rounded-2lg bg-background-tertiary-default px-3 py-2 text-body-regular text-text-primary max-sm:py-2.5 max-sm:text-base ring-2 ring-inset ring-transparent outline-none hover:ring-border-button-hover focus:ring-border-button-active"
          >
            <option value="">None</option>
            {otherMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="role">Role</Label>
          <select
            id="role"
            name="role"
            defaultValue={user.role}
            className="w-full rounded-2lg bg-background-tertiary-default px-3 py-2 text-body-regular text-text-primary max-sm:py-2.5 max-sm:text-base ring-2 ring-inset ring-transparent outline-none hover:ring-border-button-hover focus:ring-border-button-active"
          >
            <option value="MEMBER">Member</option>
            <option value="MODERATOR">Moderator</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        <SubmitButton pendingLabel="Saving…">Save changes</SubmitButton>
      </form>
    </div>
  );
}
