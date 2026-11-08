import Link from "next/link";
import { LevelBadge } from "@/components/level/LevelBadge";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";
import { COMMENT_XP_RULES } from "@/lib/xp-rules";
import { addComment } from "@/app/(app)/recipes/[recipeId]/actions";
import { deleteComment } from "@/app/admin/comments/actions";

interface CommentItem {
  id: string;
  body: string;
  createdAt: Date;
  user: { id: string; name: string; avatarUrl: string | null; xp: number };
}

export function CommentThread({
  recipeId,
  comments,
  canComment,
  canModerate = false,
}: {
  recipeId: string;
  comments: CommentItem[];
  canComment: boolean;
  /** Staff can remove any comment. */
  canModerate?: boolean;
}) {
  return (
    <section className="mt-10">
      <h2 className="mb-4 text-title-3-semibold text-text-primary">
        Comments {comments.length > 0 && `(${comments.length})`}
      </h2>

      {canComment ? (
        <form action={addComment.bind(null, recipeId)} className="mb-6 flex flex-col gap-2">
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
        <ul className="space-y-4">
          {comments.map((comment) => (
            <li key={comment.id} className="border-t border-separator-border pt-4">
              <div className="flex items-center gap-2">
                {comment.user.avatarUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={comment.user.avatarUrl}
                    alt=""
                    className="h-6 w-6 rounded-full object-cover"
                  />
                )}
                <Link
                  href={`/profile/${comment.user.id}`}
                  className="text-body-medium text-text-primary hover:text-button-ghost-foreground hover:underline"
                >
                  {comment.user.name}
                </Link>
                <LevelBadge xp={comment.user.xp} />
                <span className="text-caption-1-regular text-text-secondary">
                  {comment.createdAt.toLocaleDateString()}
                </span>
                {canModerate && (
                  <form action={deleteComment.bind(null, comment.id)} className="ml-auto">
                    <SubmitButton variant="ghost" className="h-8" pendingLabel="Deleting…">
                      Delete
                    </SubmitButton>
                  </form>
                )}
              </div>
              <p className="mt-1 whitespace-pre-line text-body-regular text-text-primary">{comment.body}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
