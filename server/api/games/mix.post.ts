import { GAME_IDS } from '#shared/validation'

// شروع جلسهٔ ترکیبی: ۳ تا ۵ بازی متمایز (بدون تکرار) به‌صورت تصادفی
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const count = 3 + Math.floor(Math.random() * 3)
  const pool = [...GAME_IDS]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j]!, pool[i]!]
  }
  const gameIds = pool.slice(0, count)
  const session = await prisma.mixSession.create({ data: { userId: user.id, gameIds, totalScore: 0 } })
  return { id: session.id, gameIds }
})
