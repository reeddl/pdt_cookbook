import Link from "next/link";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";
import { addComment } from "@/app/(app)/recipes/[recipeId]/actions";

interface CommentItem {
  id: string;
  body: string;
  createdAt: Date;
  user: { id: string; name: string; avatarUrl: string | null };
}

export function CommentThread({
  recipeId,
  comments,
  canComment,
}: {
  recipeId: string;
  comments: CommentItem[];
  canComment: boolean;
}) {
  return (
    <section className="mt-10">
      <h2 className="mb-4 text-title-3-semibold text-text-primary">
        Comments {comments.length > 0 && `(${comments.length})`}
      </h2>

      {canComment ? (
        <form action={addComment.bind(null, recipeId)} className="mb-6 flex flex-col gap-2">
          <Textarea name="body" placeholder="Share a tip or a note about this recipe…" rows={3} required />
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
                <span className="text-caption-1-regular text-text-secondary">
                  {comment.createdAt.toLocaleDateString()}
                </span>
              </div>
              <p className="mt-1 whitespace-pre-line text-body-regular text-text-primary">{comment.body}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
