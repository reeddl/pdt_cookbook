import { Card } from "@/components/ui/card";
import { FOODIE_SCORE_WEIGHTS, foodieRank, type FoodieScoreParts } from "@/lib/foodieScore";

const BREAKDOWN: { key: keyof FoodieScoreParts; label: string; weight: number }[] = [
  {
    key: "recipesPublished",
    label: "recipes in the cookbook",
    weight: FOODIE_SCORE_WEIGHTS.recipePublished,
  },
  {
    key: "favoritesReceived",
    label: "favorites earned",
    weight: FOODIE_SCORE_WEIGHTS.favoriteReceived,
  },
  {
    key: "commentsWritten",
    label: "comments written",
    weight: FOODIE_SCORE_WEIGHTS.commentWritten,
  },
];

export function FoodieScoreCard({ score, parts }: { score: number; parts: FoodieScoreParts }) {
  return (
    <Card className="flex flex-wrap items-center gap-x-8 gap-y-4 p-5">
      <div>
        <p className="text-caption-1-semibold uppercase tracking-wide text-text-secondary">
          Foodie score
        </p>
        <p className="text-display-4-semibold text-text-primary">{score}</p>
        <p className="text-body-regular text-text-secondary">{foodieRank(score)}</p>
      </div>
      <dl className="flex flex-wrap gap-x-6 gap-y-2">
        {BREAKDOWN.map(({ key, label, weight }) => (
          <div key={key}>
            <dt className="text-caption-1-regular text-text-secondary">
              {label} <span className="opacity-70">×{weight}</span>
            </dt>
            <dd className="text-title-3-medium font-medium text-text-primary">{parts[key]}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
