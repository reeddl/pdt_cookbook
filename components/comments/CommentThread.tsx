import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { addComment } from "@/app/(app)/recipes/[recipeId]/actions";

interface CommentItem {
  id: string;
  body: string;
  createdAt: Date;
  user: { name: string; avatarUrl: string | null };
}

export function CommentThread({
  recipeId,
  comments,
}: {
  recipeId: string;
  comments: CommentItem[];
}) {
  return (
    <section className="mt-10">
      <h2 className="mb-4 font-display text-lg text-text">
        Comments {comments.length > 0 && `(${comments.length})`}
      </h2>

      <form action={addComment.bind(null, recipeId)} className="mb-6 flex flex-col gap-2">
        <Textarea name="body" placeholder="Share a tip or a note about this recipe…" rows={3} required />
        <Button type="submit" className="self-end">
          Post comment
        </Button>
      </form>

      {comments.length === 0 ? (
        <p className="text-sm text-text-muted">No comments yet — be the first.</p>
      ) : (
        <ul className="space-y-4">
          {comments.map((comment) => (
            <li key={comment.id} className="border-t border-border pt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-text">{comment.user.name}</span>
                <span className="text-xs text-text-muted">
                  {comment.createdAt.toLocaleDateString()}
                </span>
              </div>
              <p className="mt-1 whitespace-pre-line text-sm text-text">{comment.body}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
