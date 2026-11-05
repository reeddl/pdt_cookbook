import { SubmitButton } from "@/components/ui/submit-button";
import { toggleFavorite } from "@/app/(app)/recipes/[recipeId]/actions";

export function FavoriteButton({
  recipeId,
  isFavorited,
}: {
  recipeId: string;
  isFavorited: boolean;
}) {
  return (
    <form action={toggleFavorite.bind(null, recipeId)}>
      <SubmitButton
        variant={isFavorited ? "primary" : "secondary"}
        className="whitespace-nowrap"
        pendingLabel={isFavorited ? "Removing…" : "Saving…"}
      >
        {isFavorited ? "★ Favorited" : "☆ Favorite"}
      </SubmitButton>
    </form>
  );
}
