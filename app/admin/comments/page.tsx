import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { deleteComment } from "./actions";

export default async function AdminCommentsPage() {
  const comments = await prisma.comment.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { id: true, name: true } },
      recipe: { select: { id: true, title: true } },
    },
  });

  return (
    <div className="space-y-3">
      <p className="text-body-regular text-text-secondary">Most recent 100 comments, newest first.</p>
      {comments.length === 0 ? (
        <p className="text-body-regular text-text-secondary">No comments yet.</p>
      ) : (
        comments.map((comment) => (
          <Card key={comment.id} className="flex items-start justify-between gap-4 p-4">
            <div className="min-w-0">
              <p className="text-caption-1-regular text-text-secondary">
                <span className="text-body-medium text-text-primary">{comment.user.name}</span> on{" "}
                <Link
                  href={`/recipes/${comment.recipe.id}`}
                  className="text-button-ghost-foreground hover:underline"
                >
                  {comment.recipe.title}
                </Link>{" "}
                · {comment.createdAt.toLocaleString()}
              </p>
              <p className="mt-1 whitespace-pre-line break-words text-body-regular text-text-primary">
                {comment.body}
              </p>
            </div>
            <form action={deleteComment.bind(null, comment.id)}>
              <SubmitButton variant="danger" pendingLabel="Deleting…">
                Delete
              </SubmitButton>
            </form>
          </Card>
        ))
      )}
    </div>
  );
}
