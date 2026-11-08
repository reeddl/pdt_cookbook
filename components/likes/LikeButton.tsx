import { SubmitButton } from "@/components/ui/submit-button";
import { toggleLike } from "@/app/(app)/recipes/[recipeId]/actions";

export function LikeButton({
  recipeId,
  isLiked,
  likeCount,
}: {
  recipeId: string;
  isLiked: boolean;
  likeCount: number;
}) {
  return (
    <form action={toggleLike.bind(null, recipeId)}>
      <SubmitButton
        variant={isLiked ? "primary" : "secondary"}
        className="whitespace-nowrap"
        pendingLabel={isLiked ? "Removing…" : "Liking…"}
      >
        {isLiked ? "♥ Liked" : "♡ Like"} · {likeCount}
      </SubmitButton>
    </form>
  );
}
