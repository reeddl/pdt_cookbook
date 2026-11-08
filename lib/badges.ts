/** Achievement definitions. Earned badges are stored (UserBadge); the rules live here. */
export interface BadgeStats {
  recipesPublished: number;
  likesReceived: number;
  likesGiven: number;
  commentsWritten: number;
  loginDays: number;
}

export interface BadgeDefinition {
  key: string;
  name: string;
  description: string;
  icon: string;
  earned: (stats: BadgeStats) => boolean;
}

export const BADGES: BadgeDefinition[] = [
  { key: "first-dish", name: "First Dish", icon: "🍳", description: "Get a recipe into the cookbook", earned: (s) => s.recipesPublished >= 1 },
  { key: "cookbook-author", name: "Cookbook Author", icon: "📖", description: "Get 5 recipes into the cookbook", earned: (s) => s.recipesPublished >= 5 },
  { key: "crowd-pleaser", name: "Crowd Pleaser", icon: "👏", description: "Receive 10 likes from other members", earned: (s) => s.likesReceived >= 10 },
  { key: "fan-favorite", name: "Fan Favorite", icon: "🏆", description: "Receive 50 likes from other members", earned: (s) => s.likesReceived >= 50 },
  { key: "taste-tester", name: "Taste Tester", icon: "👍", description: "Like 10 recipes", earned: (s) => s.likesGiven >= 10 },
  { key: "tasting-notes", name: "Tasting Notes", icon: "💬", description: "Leave 5 helpful comments", earned: (s) => s.commentsWritten >= 5 },
  { key: "table-talk", name: "Table Talk", icon: "🗣️", description: "Leave 25 helpful comments", earned: (s) => s.commentsWritten >= 25 },
  { key: "regular", name: "Regular", icon: "📅", description: "Visit on 7 different days", earned: (s) => s.loginDays >= 7 },
  { key: "fixture", name: "Fixture", icon: "🔥", description: "Visit on 30 different days", earned: (s) => s.loginDays >= 30 },
];

export function earnedBadgeKeys(stats: BadgeStats): string[] {
  return BADGES.filter((b) => b.earned(stats)).map((b) => b.key);
}
