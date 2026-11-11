-- CreateTable
CREATE TABLE "Family" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Family_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Family_name_key" ON "Family"("name");

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "familyId" TEXT;

-- CreateIndex
CREATE INDEX "User_familyId_idx" ON "User"("familyId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed the families so every environment (production included) has them after deploy.
INSERT INTO "Family" ("id", "name", "sortOrder") VALUES
    ('family_suck_n_fuck', 'Suck n Fuck', 1),
    ('family_big_baller_fam', 'Big Baller Fam', 2),
    ('family_remmy_fam', 'Remmy Fam', 3),
    ('family_rothschild', 'Rothschild', 4),
    ('family_kamikazi', 'Kamikazi', 5),
    ('family_jaeger_fam', 'Jaeger Fam', 6)
ON CONFLICT ("name") DO NOTHING;
