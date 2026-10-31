import { ACHIEVEMENTS } from '#shared/gamification'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const got = await prisma.userAchievement.findMany({ where: { userId: user.id } })
  const at = new Map(got.map((a) => [a.achievementId, a.unlockedAt]))
  return { achievements: ACHIEVEMENTS.map((a) => ({ ...a, unlocked: at.has(a.id), unlockedAt: at.get(a.id) ?? null })) }
})
