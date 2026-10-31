-- AlterTable
ALTER TABLE "OddGroup" DROP COLUMN "level",
DROP COLUMN "odd",
ADD COLUMN     "family" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Proverb" DROP COLUMN "distractors";

-- CreateIndex
CREATE UNIQUE INDEX "OddGroup_name_key" ON "OddGroup"("name");

-- CreateIndex
CREATE INDEX "OddGroup_family_idx" ON "OddGroup"("family");

-- CreateIndex
CREATE UNIQUE INDEX "Proverb_text_key" ON "Proverb"("text");

-- CreateIndex
CREATE UNIQUE INDEX "WordPair_a_b_key" ON "WordPair"("a", "b");

