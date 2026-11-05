import { prisma } from "@/lib/prisma";

export interface FamilyMember {
  id: string;
  name: string;
  bigId: string | null;
}

export async function getFamilyMembers(): Promise<FamilyMember[]> {
  return prisma.user.findMany({
    where: { status: "APPROVED" },
    select: { id: true, name: true, bigId: true },
  });
}

export function getBigChain(userId: string, members: FamilyMember[]): FamilyMember[] {
  const byId = new Map(members.map((m) => [m.id, m]));
  const chain: FamilyMember[] = [];
  let current = byId.get(userId)?.bigId ?? null;
  const seen = new Set<string>();

  while (current && !seen.has(current)) {
    seen.add(current);
    const big = byId.get(current);
    if (!big) break;
    chain.push(big);
    current = big.bigId;
  }

  return chain;
}

export interface LittleNode extends FamilyMember {
  littles: LittleNode[];
}

export function getLittlesTree(userId: string, members: FamilyMember[]): LittleNode[] {
  const childrenByBig = new Map<string, FamilyMember[]>();
  for (const member of members) {
    if (!member.bigId) continue;
    const list = childrenByBig.get(member.bigId) ?? [];
    list.push(member);
    childrenByBig.set(member.bigId, list);
  }

  function build(id: string, ancestors: Set<string>): LittleNode[] {
    const children = childrenByBig.get(id) ?? [];
    return children
      .filter((child) => !ancestors.has(child.id))
      .map((child) => ({
        ...child,
        littles: build(child.id, new Set([...ancestors, child.id])),
      }));
  }

  return build(userId, new Set([userId]));
}
