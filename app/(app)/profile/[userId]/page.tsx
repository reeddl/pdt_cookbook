import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/card";
import { FamilyTree } from "@/components/family/FamilyTree";
import { getFamilyMembers, getBigChain, getLittlesTree } from "@/lib/family";

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { userId } = await params;

  if (userId === session.user.id) redirect("/profile");

  const [user, members] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    getFamilyMembers(),
  ]);

  if (!user || user.status !== "APPROVED") notFound();

  const bigChain = getBigChain(user.id, members);
  const littles = getLittlesTree(user.id, members);

  return (
    <div>
      <h1 className="font-display text-2xl text-text">{user.name}</h1>
      <div className="mt-2 flex flex-wrap gap-2">
        {user.pledgeClass && <Badge>{user.pledgeClass}</Badge>}
        {user.graduationYear && <Badge>Class of {user.graduationYear}</Badge>}
        {user.bondNumber && <Badge>Bond #{user.bondNumber}</Badge>}
      </div>

      <section className="mt-8">
        <h2 className="mb-4 font-display text-lg text-text">Family</h2>
        <FamilyTree bigChain={bigChain} littles={littles} />
      </section>
    </div>
  );
}
