-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT,
    "fingerprint" TEXT NOT NULL,
    "isRegistered" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Score" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "rawScore" INTEGER NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL,
    "duration" INTEGER NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Score_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "finalScore" INTEGER,
    "rounds" INTEGER,

    CONSTRAINT "GameSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MixSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gameIds" TEXT[],
    "totalScore" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MixSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "XpLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "gameId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "XpLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserStreak" (
    "userId" TEXT NOT NULL,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastPlayDate" TIMESTAMP(3),

    CONSTRAINT "UserStreak_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "UserAchievement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyChallengeCompletion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "day" TEXT NOT NULL,

    CONSTRAINT "DailyChallengeCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Word" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "Word_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryWord" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "category" TEXT NOT NULL,

    CONSTRAINT "CategoryWord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WordPair" (
    "id" SERIAL NOT NULL,
    "a" TEXT NOT NULL,
    "b" TEXT NOT NULL,
    "isAntonym" BOOLEAN NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "WordPair_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proverb" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "distractors" TEXT[],
    "level" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Proverb_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OddGroup" (
    "id" SERIAL NOT NULL,
    "members" TEXT[],
    "odd" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "OddGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_fingerprint_key" ON "User"("fingerprint");

-- CreateIndex
CREATE INDEX "Score_gameId_createdAt_idx" ON "Score"("gameId", "createdAt");

-- CreateIndex
CREATE INDEX "Score_userId_gameId_idx" ON "Score"("userId", "gameId");

-- CreateIndex
CREATE INDEX "Score_createdAt_idx" ON "Score"("createdAt");

-- CreateIndex
CREATE INDEX "MixSession_totalScore_idx" ON "MixSession"("totalScore");

-- CreateIndex
CREATE INDEX "XpLog_userId_idx" ON "XpLog"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserAchievement_userId_achievementId_key" ON "UserAchievement"("userId", "achievementId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyChallengeCompletion_userId_gameId_day_key" ON "DailyChallengeCompletion"("userId", "gameId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "Word_text_key" ON "Word"("text");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryWord_text_key" ON "CategoryWord"("text");

-- CreateIndex
CREATE INDEX "CategoryWord_category_idx" ON "CategoryWord"("category");

-- CreateIndex
CREATE INDEX "WordPair_level_idx" ON "WordPair"("level");

-- CreateIndex
CREATE INDEX "Proverb_level_idx" ON "Proverb"("level");

-- AddForeignKey
ALTER TABLE "Score" ADD CONSTRAINT "Score_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MixSession" ADD CONSTRAINT "MixSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "XpLog" ADD CONSTRAINT "XpLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStreak" ADD CONSTRAINT "UserStreak_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyChallengeCompletion" ADD CONSTRAINT "DailyChallengeCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
