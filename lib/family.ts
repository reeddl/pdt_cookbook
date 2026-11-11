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

export interface FamilyOption {
  id: string;
  name: string;
}

/** Every family, in the order they should appear in dropdowns. */
export async function getFamilies(): Promise<FamilyOption[]> {
  return prisma.family.findMany({
    select: { id: true, name: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

/**
 * Turns the dropdown's raw form value into a family id that exists, or null.
 * An empty value means "no family"; an unknown id (stale form, tampering) is
 * treated the same way rather than failing the whole save.
 */
export async function resolveFamilyId(raw: FormDataEntryValue | null): Promise<string | null> {
  if (typeof raw !== "string" || !raw) return null;
  const family = await prisma.family.findUnique({ where: { id: raw }, select: { id: true } });
  return family?.id ?? null;
}
