-- Favorites become Likes. Renamed in place (not drop/create) so existing rows survive.
ALTER TABLE "Favorite" RENAME TO "Like";
ALTER TABLE "Like" RENAME CONSTRAINT "Favorite_pkey" TO "Like_pkey";
ALTER TABLE "Like" RENAME CONSTRAINT "Favorite_userId_fkey" TO "Like_userId_fkey";
ALTER TABLE "Like" RENAME CONSTRAINT "Favorite_recipeId_fkey" TO "Like_recipeId_fkey";
CREATE INDEX "Like_recipeId_idx" ON "Like"("recipeId");

-- XP ledger, cached total, and badges.
CREATE TYPE "XpKind" AS ENUM ('DAILY_LOGIN', 'COMMENT', 'LIKE_GIVEN', 'LIKE_RECEIVED', 'RECIPE_PUBLISHED');

ALTER TABLE "User" ADD COLUMN "xp" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "XpEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "XpKind" NOT NULL,
    "refKey" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "recipeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "XpEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserBadge" (
    "userId" TEXT NOT NULL,
    "badgeKey" TEXT NOT NULL,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("userId","badgeKey")
);

CREATE INDEX "XpEvent_userId_kind_createdAt_idx" ON "XpEvent"("userId", "kind", "createdAt");
CREATE UNIQUE INDEX "XpEvent_userId_kind_refKey_key" ON "XpEvent"("userId", "kind", "refKey");

ALTER TABLE "XpEvent" ADD CONSTRAINT "XpEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: credit what members already did, using the point values in lib/xp.ts
-- (recipe 30, like received 3, like given 1, comment 3). Daily-login history
-- doesn't exist, so that starts from now. Badges are granted lazily on first
-- profile view.

-- Published recipes with a member submitter.
INSERT INTO "XpEvent" ("id", "userId", "kind", "refKey", "points", "recipeId", "createdAt")
SELECT gen_random_uuid()::text, r."submittedById", 'RECIPE_PUBLISHED', r."id", 30, r."id", COALESCE(r."reviewedAt", r."createdAt")
FROM "Recipe" r
WHERE r."status" = 'PUBLISHED' AND r."submittedById" IS NOT NULL;

-- Likes received: one per (liker, recipe), never for your own recipe.
INSERT INTO "XpEvent" ("id", "userId", "kind", "refKey", "points", "recipeId", "createdAt")
SELECT gen_random_uuid()::text, r."submittedById", 'LIKE_RECEIVED', l."userId" || ':' || l."recipeId", 3, r."id", l."createdAt"
FROM "Like" l
JOIN "Recipe" r ON r."id" = l."recipeId"
WHERE r."status" = 'PUBLISHED' AND r."submittedById" IS NOT NULL AND r."submittedById" <> l."userId";

-- Likes given: one per recipe liked, never your own.
INSERT INTO "XpEvent" ("id", "userId", "kind", "refKey", "points", "recipeId", "createdAt")
SELECT gen_random_uuid()::text, l."userId", 'LIKE_GIVEN', l."recipeId", 1, l."recipeId", l."createdAt"
FROM "Like" l
JOIN "Recipe" r ON r."id" = l."recipeId"
WHERE r."status" = 'PUBLISHED' AND r."submittedById" IS DISTINCT FROM l."userId";

-- Comments: the first substantive one per member per recipe, not on your own recipe.
INSERT INTO "XpEvent" ("id", "userId", "kind", "refKey", "points", "recipeId", "createdAt")
SELECT DISTINCT ON (c."userId", c."recipeId")
  gen_random_uuid()::text, c."userId", 'COMMENT', c."id", 3, c."recipeId", c."createdAt"
FROM "Comment" c
JOIN "Recipe" r ON r."id" = c."recipeId"
WHERE r."status" = 'PUBLISHED'
  AND r."submittedById" IS DISTINCT FROM c."userId"
  AND char_length(btrim(c."body")) >= 20
ORDER BY c."userId", c."recipeId", c."createdAt";

UPDATE "User" u
SET "xp" = e."total"
FROM (SELECT "userId", SUM("points")::int AS "total" FROM "XpEvent" GROUP BY "userId") e
WHERE e."userId" = u."id";
