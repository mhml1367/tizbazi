import { levelFromXp, xpForLevel } from '#shared/gamification'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const totalXp = (await prisma.xpLog.aggregate({ where: { userId: user.id }, _sum: { amount: true } }))._sum.amount ?? 0
  const level = levelFromXp(totalXp)
  const floor = xpForLevel(level)
  const next = xpForLevel(level + 1)
  return { totalXp, level, levelStartXp: floor, nextLevelXp: next, progress: (totalXp - floor) / (next - floor) }
})
