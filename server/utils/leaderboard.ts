import { Prisma } from '../generated/prisma/client'
import { periodStart, type Period } from '#shared/periods'

export interface LeaderRow {
  rank: number
  userId: string
  displayName: string
  /** بازی خاص: بهترین امتیاز · همه: مجموع امتیازها · ترکیبی: بهترین امتیاز کل ترکیب */
  score: number
  games: number
  uniqueGames?: number
}

// هر تراکنش یا خود کلاینت (هر دو $queryRaw دارند)
type Db = { $queryRaw: <T = unknown>(q: TemplateStringsArray | Prisma.Sql, ...v: unknown[]) => Promise<T> }

/**
 * لیدربورد بر اساس بازه و بازی؛ رتبه با window function (RANK) محاسبه می‌شود.
 * همهٔ مقادیر به‌صورت پارامتر به SQL می‌روند (بدون الحاق رشته).
 */
export async function leaderboardRows(db: Db, gameId: string, period: Period, limit = 20): Promise<LeaderRow[]> {
  const since = periodStart(period) ?? new Date(0)

  if (gameId === 'mix') {
    return db.$queryRaw<LeaderRow[]>(Prisma.sql`
      SELECT RANK() OVER (ORDER BY MAX(m."totalScore") DESC)::int AS rank,
             u.id AS "userId", u."displayName",
             MAX(m."totalScore")::int AS score, COUNT(m.id)::int AS games
      FROM "MixSession" m JOIN "User" u ON m."userId" = u.id
      WHERE m.completed AND m."createdAt" >= ${since}
      GROUP BY u.id, u."displayName"
      ORDER BY score DESC, u."displayName" LIMIT ${limit}`)
  }

  if (gameId === 'all') {
    return db.$queryRaw<LeaderRow[]>(Prisma.sql`
      SELECT RANK() OVER (ORDER BY SUM(s."rawScore") DESC)::int AS rank,
             u.id AS "userId", u."displayName",
             SUM(s."rawScore")::int AS score, COUNT(s.id)::int AS games,
             COUNT(DISTINCT s."gameId")::int AS "uniqueGames"
      FROM "Score" s JOIN "User" u ON s."userId" = u.id
      WHERE s."createdAt" >= ${since}
      GROUP BY u.id, u."displayName"
      ORDER BY score DESC, u."displayName" LIMIT ${limit}`)
  }

  return db.$queryRaw<LeaderRow[]>(Prisma.sql`
    SELECT RANK() OVER (ORDER BY MAX(s."rawScore") DESC)::int AS rank,
           u.id AS "userId", u."displayName",
           MAX(s."rawScore")::int AS score, COUNT(s.id)::int AS games
    FROM "Score" s JOIN "User" u ON s."userId" = u.id
    WHERE s."gameId" = ${gameId} AND s."createdAt" >= ${since}
    GROUP BY u.id, u."displayName"
    ORDER BY score DESC, u."displayName" LIMIT ${limit}`)
}
