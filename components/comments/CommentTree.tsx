"use client";

import Link from "next/link";
import { useState } from "react";
import { LevelBadge } from "@/components/level/LevelBadge";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { addComment, toggleCommentLike } from "@/app/(app)/recipes/[recipeId]/actions";
import { deleteComment } from "@/app/admin/comments/actions";
import { countDescendants, type CommentNodeData } from "@/lib/commentTree";

/** Replies stop indenting after this depth so deep threads don't squeeze to nothing. */
const MAX_INDENT_DEPTH = 4;

interface TreeProps {
  recipeId: string;
  canComment: boolean;
  canModerate: boolean;
}

export function CommentTree({ comments, ...rest }: TreeProps & { comments: CommentNodeData[] }) {
  return (
    <ul className="space-y-4">
      {comments.map((comment) => (
        <CommentNode key={comment.id} node={comment} depth={0} {...rest} />
      ))}
    </ul>
  );
}

function CommentNode({
  node,
  depth,
  recipeId,
  canComment,
  canModerate,
}: TreeProps & { node: CommentNodeData; depth: number }) {
  const [expanded, setExpanded] = useState(false);
  const [replying, setReplying] = useState(false);

  // Collapsed, each level shows only its most-liked reply (replies arrive sorted).
  const visible = expanded ? node.replies : node.replies.slice(0, 1);
  const hidden = node.replies.slice(visible.length);
  const hiddenCount = hidden.reduce((sum, r) => sum + 1 + countDescendants(r), 0);

  return (
    <li className={depth === 0 ? "border-t border-separator-border pt-4" : ""}>
      <div className="flex items-center gap-2">
        {node.user.avatarUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={node.user.avatarUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
        )}
        <Link
          href={`/profile/${node.user.id}`}
          className="text-body-medium text-text-primary hover:text-button-ghost-foreground hover:underline"
        >
          {node.user.name}
        </Link>
        <LevelBadge xp={node.user.xp} />
        <span className="text-caption-1-regular text-text-secondary">
          {new Date(node.createdAt).toLocaleDateString()}
        </span>
      </div>
      <p className="mt-1 whitespace-pre-line text-body-regular text-text-primary">{node.body}</p>

      <div className="mt-1 flex items-center gap-1">
        <form action={toggleCommentLike.bind(null, node.id)}>
          <SubmitButton
            variant="ghost"
            className="h-8"
            aria-pressed={node.likedByMe}
            aria-label={node.likedByMe ? "Unlike comment" : "Like comment"}
          >
            {node.likedByMe ? "♥" : "♡"} {node.likeCount}
          </SubmitButton>
        </form>
        {canComment && (
          <Button type="button" variant="ghost" className="h-8" onClick={() => setReplying((v) => !v)}>
            {replying ? "Cancel" : "Reply"}
          </Button>
        )}
        {canModerate && (
          <form
            action={deleteComment.bind(null, node.id)}
            onSubmit={(e) => {
              if (node.replies.length > 0 && !window.confirm("Deleting this comment also deletes its replies. Continue?")) {
                e.preventDefault();
              }
            }}
          >
            <SubmitButton variant="ghost" className="h-8" pendingLabel="Deleting…">
              Delete
            </SubmitButton>
          </form>
        )}
      </div>

      {replying && (
        <form
          action={async (formData) => {
            await addComment(recipeId, node.id, formData);
            setReplying(false);
            setExpanded(true);
          }}
          className="mt-2 flex flex-col gap-2"
        >
          <Textarea name="body" placeholder={`Reply to ${node.user.name}…`} rows={2} required autoFocus />
          <SubmitButton className="self-end" pendingLabel="Posting…">
            Post reply
          </SubmitButton>
        </form>
      )}

      {node.replies.length > 0 && (
        <div
          className={
            depth < MAX_INDENT_DEPTH ? "mt-3 ml-3 border-l border-separator-border pl-4" : "mt-3"
          }
        >
          <ul className="space-y-4">
            {visible.map((reply) => (
              <CommentNode
                key={reply.id}
                node={reply}
                depth={depth + 1}
                recipeId={recipeId}
                canComment={canComment}
                canModerate={canModerate}
              />
            ))}
          </ul>
          {hiddenCount > 0 && (
            <Button type="button" variant="ghost" className="mt-2 h-8" onClick={() => setExpanded(true)}>
              See {hiddenCount} more {hiddenCount === 1 ? "reply" : "replies"}
            </Button>
          )}
          {expanded && node.replies.length > 1 && (
            <Button type="button" variant="ghost" className="mt-2 h-8" onClick={() => setExpanded(false)}>
              Show fewer
            </Button>
          )}
        </div>
      )}
    </li>
  );
}
