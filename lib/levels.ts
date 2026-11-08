/**
 * Levels and ranks — pure functions, no database. A member's level is always
 * derived from their total XP, so tuning the curve never needs a migration.
 */
export const MAX_LEVEL = 50;

/**
 * Total XP needed to *reach* `level`. Level 1 is free, level 2 is 10 XP
 * (about a day's login plus a comment), and each level costs a bit more than
 * the last: 10 * (level - 1)^1.5.
 */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.round(10 * Math.pow(Math.min(level, MAX_LEVEL) - 1, 1.5));
}

export function levelForXp(xp: number): number {
  let level = 1;
  while (level < MAX_LEVEL && xp >= xpForLevel(level + 1)) level++;
  return level;
}

/** Ten levels per rank. */
const RANKS = [
  { minLevel: 1, name: "Dishwasher" },
  { minLevel: 11, name: "Prep cook" },
  { minLevel: 21, name: "Line cook" },
  { minLevel: 31, name: "Sous chef" },
  { minLevel: 41, name: "Head chef" },
] as const;

export function rankForLevel(level: number): string {
  let name: string = RANKS[0].name;
  for (const rank of RANKS) if (level >= rank.minLevel) name = rank.name;
  return name;
}

export interface LevelProgress {
  level: number;
  rank: string;
  xp: number;
  /** XP earned inside the current level. */
  xpIntoLevel: number;
  /** XP the current level spans; null at max level. */
  xpForNext: number | null;
  /** 0–100 progress to the next level (100 at max level). */
  percent: number;
}

export function levelProgress(xp: number): LevelProgress {
  const safeXp = Math.max(0, xp);
  const level = levelForXp(safeXp);
  const base = xpForLevel(level);
  if (level >= MAX_LEVEL) {
    return { level, rank: rankForLevel(level), xp: safeXp, xpIntoLevel: safeXp - base, xpForNext: null, percent: 100 };
  }
  const span = xpForLevel(level + 1) - base;
  const into = safeXp - base;
  return {
    level,
    rank: rankForLevel(level),
    xp: safeXp,
    xpIntoLevel: into,
    xpForNext: span,
    percent: Math.min(100, Math.round((into / span) * 100)),
  };
}
