import { levelForXp, rankForLevel } from "@/lib/levels";
import { cn } from "@/lib/cn";

/** Compact "Lv 4" pill shown beside a member's name. */
export function LevelBadge({ xp, className }: { xp: number; className?: string }) {
  const level = levelForXp(xp);
  return (
    <span
      title={`${rankForLevel(level)} · ${xp} XP`}
      className={cn(
        "inline-flex items-center rounded-full bg-button-ghost-background px-1.5 py-px text-caption-1-semibold text-button-ghost-foreground",
        className
      )}
    >
      Lv {level}
    </span>
  );
}
