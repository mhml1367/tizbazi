import { dailyChallenge } from '#shared/daily'
import { DAILY_ALL_BONUS_XP, DAILY_BADGE_XP, tehranDayKey } from '#shared/gamification'

// «چالش امروز»: سه بازی + وضعیت تکمیل کاربر
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const day = tehranDayKey()
  const games = dailyChallenge(day)
  const done = await prisma.dailyChallengeCompletion.findMany({ where: { userId: user.id, day } })
  const doneSet = new Set(done.map((d) => d.gameId))
  return {
    day,
    badgeXp: DAILY_BADGE_XP,
    allBonusXp: DAILY_ALL_BONUS_XP,
    games: games.map((gameId) => ({ gameId, done: doneSet.has(gameId) })),
    allDone: games.every((g) => doneSet.has(g))
  }
})
