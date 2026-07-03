import { Button } from "@/components/ui/button";
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
      <Button type="submit" variant={isFavorited ? "primary" : "secondary"}>
        {isFavorited ? "★ Favorited" : "☆ Favorite"}
      </Button>
    </form>
  );
}
