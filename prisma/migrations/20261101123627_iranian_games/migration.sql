-- CreateTable
CREATE TABLE "DailyPuzzle" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "game" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "guesses" TEXT[],
    "solved" BOOLEAN NOT NULL DEFAULT false,
    "finished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyPuzzle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentItem" (
    "id" SERIAL NOT NULL,
    "kind" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "ContentItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyPuzzle_userId_game_createdAt_idx" ON "DailyPuzzle"("userId", "game", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DailyPuzzle_userId_game_key_key" ON "DailyPuzzle"("userId", "game", "key");

-- CreateIndex
CREATE INDEX "ContentItem_kind_idx" ON "ContentItem"("kind");

-- CreateIndex
CREATE UNIQUE INDEX "ContentItem_kind_key_key" ON "ContentItem"("kind", "key");

-- AddForeignKey
ALTER TABLE "DailyPuzzle" ADD CONSTRAINT "DailyPuzzle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

