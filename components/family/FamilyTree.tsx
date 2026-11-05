import Link from "next/link";
import type { FamilyMember, LittleNode } from "@/lib/family";

function LittleList({ nodes }: { nodes: LittleNode[] }) {
  if (nodes.length === 0) return null;
  return (
    <ul className="ml-4 space-y-1 border-l border-separator-border pl-4">
      {nodes.map((node) => (
        <li key={node.id}>
          <Link href={`/profile/${node.id}`} className="text-body-regular text-button-ghost-foreground hover:underline">
            {node.name}
          </Link>
          <LittleList nodes={node.littles} />
        </li>
      ))}
    </ul>
  );
}

export function FamilyTree({
  bigChain,
  littles,
}: {
  bigChain: FamilyMember[];
  littles: LittleNode[];
}) {
  if (bigChain.length === 0 && littles.length === 0) {
    return <p className="text-body-regular text-text-secondary">No family connections recorded yet.</p>;
  }

  return (
    <div className="space-y-4">
      {bigChain.length > 0 && (
        <div>
          <p className="mb-1 text-caption-1-semibold uppercase tracking-wide text-text-secondary">
            Big
          </p>
          <ul className="space-y-1">
            {bigChain.map((big) => (
              <li key={big.id}>
                <Link href={`/profile/${big.id}`} className="text-body-regular text-button-ghost-foreground hover:underline">
                  {big.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      {littles.length > 0 && (
        <div>
          <p className="mb-1 text-caption-1-semibold uppercase tracking-wide text-text-secondary">
            Littles
          </p>
          <LittleList nodes={littles} />
        </div>
      )}
    </div>
  );
}
