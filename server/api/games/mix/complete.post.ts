import { z } from 'zod'

const body = z.object({ id: z.string().min(1).max(100) })

/**
 * پایان جلسهٔ ترکیبی. امتیاز کل از امتیازهای واقعیِ ذخیره‌شده محاسبه می‌شود
 * (آخرین امتیاز هر بازی پس از شروع جلسه)، نه از عددی که کلاینت بفرستد.
 */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const p = body.safeParse(await readBody(event))
  if (!p.success) throw createError({ statusCode: 400, message: p.error.issues[0]!.message })

  const session = await prisma.mixSession.findUnique({ where: { id: p.data.id } })
  if (!session || session.userId !== user.id) throw createError({ statusCode: 404, message: 'جلسهٔ ترکیبی یافت نشد' })
  if (session.completed) return { totalScore: session.totalScore, perGame: [] as { gameId: string; score: number }[], already: true }

  const perGame: { gameId: string; score: number }[] = []
  for (const gameId of session.gameIds) {
    const last = await prisma.score.findFirst({
      where: { userId: user.id, gameId, createdAt: { gte: session.createdAt } },
      orderBy: { createdAt: 'desc' }
    })
    perGame.push({ gameId, score: last?.rawScore ?? 0 })
  }
  const totalScore = perGame.reduce((s, g) => s + g.score, 0)
  await prisma.mixSession.update({ where: { id: session.id }, data: { totalScore, completed: true } })
  return { totalScore, perGame, already: false }
})
