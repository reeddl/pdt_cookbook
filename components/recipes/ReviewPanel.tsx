import Link from "next/link";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { approveRecipeFromPreview, rejectRecipeFromPreview } from "@/app/admin/recipes/actions";

interface ReviewPanelProps {
  recipeId: string;
  /** Admins and moderators get the approve/reject controls; the author just sees the notice. */
  isReviewer: boolean;
  submittedAt: Date;
}

/**
 * Sits on top of a pending recipe's page, which otherwise renders exactly as it
 * will once published, so reviewers decide with the real page in front of them.
 */
export function ReviewPanel({ recipeId, isReviewer, submittedAt }: ReviewPanelProps) {
  const submitted = submittedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/New_York" });

  return (
    <div className="mb-6 rounded-3xl bg-status-yellow-background p-4 text-body-regular text-status-yellow-text">
      <p className="text-body-medium">
        {isReviewer ? "Preview: awaiting your review" : "Preview: awaiting review"}
      </p>
      <p className="mt-1">
        This is how the recipe will look in the cookbook once it&apos;s approved. Submitted {submitted}.
        {isReviewer && (
          <>
            {" "}
            <Link href="/admin/recipes/pending" className="underline">
              Back to the queue
            </Link>
          </>
        )}
      </p>

      {isReviewer && (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-2">
          <form action={approveRecipeFromPreview.bind(null, recipeId)}>
            <SubmitButton variant="primary" pendingLabel="Approving…">
              Approve and publish
            </SubmitButton>
          </form>
          <form
            action={rejectRecipeFromPreview.bind(null, recipeId)}
            className="flex w-full flex-col items-start gap-2 sm:w-auto sm:flex-row sm:items-center"
          >
            <Input
              name="reason"
              aria-label="Reason for the submitter"
              placeholder="Reason for the submitter (required)"
              required
              className="sm:w-72"
            />
            <SubmitButton variant="danger" pendingLabel="Rejecting…">
              Reject
            </SubmitButton>
          </form>
        </div>
      )}
    </div>
  );
}
