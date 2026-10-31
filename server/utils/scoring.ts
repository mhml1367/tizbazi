import { prisma } from './db'
import { leaderboardRows } from './leaderboard'
import { dailyChallenge } from '#shared/daily'
import {
  ACHIEVEMENTS,
  DAILY_ALL_BONUS_XP,
  DAILY_BADGE_XP,
  advanceStreak,
  earnedAchievements,
  levelFromXp,
  streakBonus,
  tehranDayKey
} from '#shared/gamification'
import type { z } from 'zod'
import type { scoreSchema } from '#shared/validation'

type ScoreInput = z.infer<typeof scoreSchema>

/** ذخیرهٔ امتیاز + XP + streak + چالش روزانه + نشان‌ها در یک تراکنش */
export async function recordScore(userId: string, input: ScoreInput) {
  const today = tehranDayKey()

  return prisma.$transaction(async (tx) => {
    const { fastestCorrectMs, ...scoreData } = input
    await tx.score.create({ data: { userId, ...scoreData } })
    await tx.xpLog.create({ data: { userId, amount: input.rawScore, reason: 'game_score', gameId: input.gameId } })
    let xpGained = input.rawScore

    // streak روزانه
    const existing = await tx.userStreak.findUnique({ where: { userId } })
    const last = existing?.lastPlayDate ? tehranDayKey(existing.lastPlayDate) : null
    const st = advanceStreak(existing?.currentStreak ?? 0, existing?.longestStreak ?? 0, last, today)
    await tx.userStreak.upsert({
      where: { userId },
      create: { userId, currentStreak: st.current, longestStreak: st.longest, lastPlayDate: new Date() },
      update: { currentStreak: st.current, longestStreak: st.longest, lastPlayDate: new Date() }
    })
    let bonus = 0
    if (st.advanced) {
      bonus = streakBonus(st.current)
      await tx.xpLog.create({ data: { userId, amount: bonus, reason: 'streak_bonus' } })
      xpGained += bonus
    }

    // چالش روزانه: هر بازیِ چالش فقط یک‌بار در روز نشان می‌دهد؛ تکمیل هر سه → پاداش اضافه
    const challenge = dailyChallenge(today)
    let dailyBadge = false
    let dailyAll = false
    if (challenge.includes(input.gameId)) {
      const created = await tx.dailyChallengeCompletion.createMany({
        data: [{ userId, gameId: input.gameId, day: today }],
        skipDuplicates: true
      })
      if (created.count === 1) {
        dailyBadge = true
        await tx.xpLog.create({ data: { userId, amount: DAILY_BADGE_XP, reason: 'daily_challenge', gameId: input.gameId } })
        xpGained += DAILY_BADGE_XP
        const done = await tx.dailyChallengeCompletion.count({ where: { userId, day: today } })
        if (done >= challenge.length) {
          dailyAll = true
          await tx.xpLog.create({ data: { userId, amount: DAILY_ALL_BONUS_XP, reason: 'daily_challenge_all' } })
          xpGained += DAILY_ALL_BONUS_XP
        }
      }
    }

    // صدرنشین: رتبهٔ اول لیدربورد هفتگی با حداقل دو بازیکن
    const weekly = await leaderboardRows(tx, 'all', 'week', 2)
    const leader = weekly.length >= 2 && weekly[0]!.userId === userId && weekly[0]!.rank === 1

    // نشان‌ها
    const totalGames = await tx.score.count({ where: { userId } })
    const distinct = await tx.score.groupBy({ by: ['gameId'], where: { userId } })
    const earned = earnedAchievements({
      totalGames,
      distinctGames: distinct.length,
      streak: st.current,
      rawScore: input.rawScore,
      gameId: input.gameId,
      fastestCorrectMs,
      leader
    })
    const have = new Set(
      (await tx.userAchievement.findMany({ where: { userId }, select: { achievementId: true } })).map((a) => a.achievementId)
    )
    const fresh = earned.filter((id) => !have.has(id))
    if (fresh.length) {
      await tx.userAchievement.createMany({ data: fresh.map((achievementId) => ({ userId, achievementId })) })
    }

    const totalXp = (await tx.xpLog.aggregate({ where: { userId }, _sum: { amount: true } }))._sum.amount ?? 0
    return {
      xpGained,
      streakBonus: bonus,
      totalXp,
      level: levelFromXp(totalXp),
      streak: st.current,
      daily: { badge: dailyBadge, allDone: dailyAll },
      newAchievements: ACHIEVEMENTS.filter((a) => fresh.includes(a.id))
    }
  })
}
