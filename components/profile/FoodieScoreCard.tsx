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
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          Foodie score
        </p>
        <p className="font-display text-4xl text-accent">{score}</p>
        <p className="text-sm text-text-muted">{foodieRank(score)}</p>
      </div>
      <dl className="flex flex-wrap gap-x-6 gap-y-2">
        {BREAKDOWN.map(({ key, label, weight }) => (
          <div key={key}>
            <dt className="text-xs text-text-muted">
              {label} <span className="opacity-70">×{weight}</span>
            </dt>
            <dd className="text-lg font-medium text-text">{parts[key]}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
