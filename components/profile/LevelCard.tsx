import { Card } from "@/components/ui/card";
import { BADGES } from "@/lib/badges";
import { levelProgress } from "@/lib/levels";
import type { XpBreakdownRow } from "@/lib/xp";

const BREAKDOWN_LABELS: Record<XpBreakdownRow["kind"], string> = {
  RECIPE_PUBLISHED: "recipes in the cookbook",
  LIKE_RECEIVED: "likes received",
  COMMENT: "helpful comments",
  LIKE_GIVEN: "recipes liked",
  DAILY_LOGIN: "days visited",
};
const BREAKDOWN_ORDER: XpBreakdownRow["kind"][] = [
  "RECIPE_PUBLISHED",
  "LIKE_RECEIVED",
  "COMMENT",
  "LIKE_GIVEN",
  "DAILY_LOGIN",
];

export function LevelCard({
  xp,
  breakdown,
  earnedBadges,
}: {
  xp: number;
  breakdown: XpBreakdownRow[];
  earnedBadges: string[];
}) {
  const progress = levelProgress(xp);
  const earned = new Set(earnedBadges);

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
        <div className="min-w-[220px] flex-1">
          <p className="text-caption-1-semibold uppercase tracking-wide text-text-secondary">Level</p>
          <p className="text-display-4-semibold text-text-primary">{progress.level}</p>
          <p className="text-body-regular text-text-secondary">{progress.rank}</p>
          <div
            className="mt-3 h-2 w-full overflow-hidden rounded-full bg-background-tertiary-default"
            role="progressbar"
            aria-valuenow={progress.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progress to next level"
          >
            <div className="h-full rounded-full bg-button-ghost-foreground" style={{ width: `${progress.percent}%` }} />
          </div>
          <p className="mt-1 text-caption-1-regular text-text-secondary">
            {progress.xpForNext === null
              ? `${xp} XP · max level`
              : `${progress.xpIntoLevel} / ${progress.xpForNext} XP to level ${progress.level + 1}`}
          </p>
        </div>
        <dl className="flex flex-wrap gap-x-6 gap-y-2">
          {BREAKDOWN_ORDER.map((kind) => {
            const row = breakdown.find((r) => r.kind === kind);
            return (
              <div key={kind}>
                <dt className="text-caption-1-regular text-text-secondary">
                  {BREAKDOWN_LABELS[kind]} <span className="opacity-70">+{row?.points ?? 0} XP</span>
                </dt>
                <dd className="text-title-3-medium font-medium text-text-primary">{row?.count ?? 0}</dd>
              </div>
            );
          })}
        </dl>
      </div>

      <div className="mt-5 border-t border-separator-border pt-4">
        <p className="mb-3 text-caption-1-semibold uppercase tracking-wide text-text-secondary">
          Badges · {earned.size} / {BADGES.length}
        </p>
        <ul className="grid gap-2 sm:grid-cols-3">
          {BADGES.map((badge) => {
            const has = earned.has(badge.key);
            return (
              <li
                key={badge.key}
                title={badge.description}
                className={`flex items-center gap-2 rounded-2lg border border-separator-border px-3 py-2 ${has ? "" : "opacity-45 grayscale"}`}
              >
                <span className="text-title-3-regular" aria-hidden>{badge.icon}</span>
                <span>
                  <span className="block text-body-medium text-text-primary">{badge.name}</span>
                  <span className="block text-caption-1-regular text-text-secondary">{badge.description}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </Card>
  );
}
