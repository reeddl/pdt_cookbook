/** Flat comment rows → a sorted reply tree. Pure, so it's easy to reason about. */
export interface FlatComment {
  id: string;
  parentId: string | null;
  body: string;
  createdAt: Date;
  user: { id: string; name: string; avatarUrl: string | null; xp: number };
  likeCount: number;
  likedByMe: boolean;
}

/** Plain-data shape handed to the client component (dates as ISO strings). */
export interface CommentNodeData {
  id: string;
  body: string;
  createdAt: string;
  user: FlatComment["user"];
  likeCount: number;
  likedByMe: boolean;
  replies: CommentNodeData[];
}

/** Most-liked first; ties go to whoever spoke first. */
function byLikesThenAge(a: CommentNodeData, b: CommentNodeData) {
  return b.likeCount - a.likeCount || a.createdAt.localeCompare(b.createdAt);
}

export function buildCommentTree(flat: FlatComment[]): CommentNodeData[] {
  const nodes = new Map<string, CommentNodeData>();
  for (const c of flat) {
    nodes.set(c.id, {
      id: c.id,
      body: c.body,
      createdAt: c.createdAt.toISOString(),
      user: c.user,
      likeCount: c.likeCount,
      likedByMe: c.likedByMe,
      replies: [],
    });
  }

  const roots: CommentNodeData[] = [];
  for (const c of flat) {
    const node = nodes.get(c.id)!;
    const parent = c.parentId ? nodes.get(c.parentId) : undefined;
    // An orphaned reply (parent gone) is shown top-level rather than lost.
    (parent ? parent.replies : roots).push(node);
  }

  const sortDeep = (list: CommentNodeData[]) => {
    list.sort(byLikesThenAge);
    list.forEach((n) => sortDeep(n.replies));
  };
  sortDeep(roots);
  return roots;
}

/** Number of comments in a subtree, the node itself excluded. */
export function countDescendants(node: CommentNodeData): number {
  return node.replies.reduce((sum, r) => sum + 1 + countDescendants(r), 0);
}

/** `rootId` plus every comment beneath it, from flat {id, parentId} rows. */
export function collectSubtreeIds(rootId: string, rows: { id: string; parentId: string | null }[]): string[] {
  const children = new Map<string, string[]>();
  for (const r of rows) {
    if (r.parentId) children.set(r.parentId, [...(children.get(r.parentId) ?? []), r.id]);
  }
  const out: string[] = [];
  const stack = [rootId];
  while (stack.length) {
    const id = stack.pop()!;
    out.push(id);
    stack.push(...(children.get(id) ?? []));
  }
  return out;
}
