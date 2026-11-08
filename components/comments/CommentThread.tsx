import Link from "next/link";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";
import { CommentTree } from "@/components/comments/CommentTree";
import { addComment } from "@/app/(app)/recipes/[recipeId]/actions";
import { COMMENT_XP_RULES } from "@/lib/xp-rules";
import type { CommentNodeData } from "@/lib/commentTree";

export function CommentThread({
  recipeId,
  comments,
  totalComments,
  canComment,
  canModerate = false,
  viewOnly = false,
}: {
  recipeId: string;
  /** Top-level comments, each carrying its nested replies. */
  comments: CommentNodeData[];
  totalComments: number;
  canComment: boolean;
  /** Staff can remove any comment. */
  canModerate?: boolean;
  /** Pending members: read-only, with a note instead of the comment box. */
  viewOnly?: boolean;
}) {
  return (
    <section className="mt-10">
      <h2 className="mb-4 text-title-3-semibold text-text-primary">
        Comments {totalComments > 0 && `(${totalComments})`}
      </h2>

      {viewOnly ? (
        <p className="mb-6 text-body-regular text-text-secondary">
          Commenting opens up once an admin confirms your account.
        </p>
      ) : canComment ? (
        <form action={addComment.bind(null, recipeId, null)} className="mb-6 flex flex-col gap-2">
          <Textarea name="body" placeholder="Share a tip or a note about this recipe…" rows={3} required />
          <p className="text-caption-1-regular text-text-secondary">
            Thoughtful comments (4+ words, on someone else&apos;s recipe) earn XP — the first on each recipe, up to {COMMENT_XP_RULES.maxPerDay} a day.
          </p>
          <SubmitButton className="self-end" pendingLabel="Posting…">
            Post comment
          </SubmitButton>
        </form>
      ) : (
        <p className="mb-6 text-body-regular text-text-secondary">
          <Link href="/profile" className="text-button-ghost-foreground underline">
            Add your bond number, pledge class, and graduation year
          </Link>{" "}
          to your profile before commenting.
        </p>
      )}

      {comments.length === 0 ? (
        <p className="text-body-regular text-text-secondary">No comments yet — be the first.</p>
      ) : (
        <CommentTree
          recipeId={recipeId}
          comments={comments}
          canComment={canComment}
          canModerate={canModerate}
          viewOnly={viewOnly}
        />
      )}
    </section>
  );
}
