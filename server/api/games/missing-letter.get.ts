import { z } from 'zod'
import { ML_LIMITS, ML_RULES, makeRound, pickWords } from '#shared/games/missing-letter'

const q = z.object({ difficulty: z.coerce.number().int().min(1).max(3) })

// کلمات بر اساس طول کش می‌شوند تا هر درخواست کل جدول را نخواند
let cache: string[] | null = null

export default defineEventHandler(async (event) => {
  await requireUser(event)
  const p = q.safeParse(getQuery(event))
  if (!p.success) throw createError({ statusCode: 400, message: 'سختی نامعتبر است' })
  const difficulty = p.data.difficulty as 1 | 2 | 3

  if (!cache) cache = (await prisma.word.findMany({ select: { text: true } })).map((w) => w.text)
  const words = pickWords(cache, difficulty, ML_LIMITS.rounds, Math.random)
  if (words.length < ML_LIMITS.rounds) {
    throw createError({ statusCode: 503, message: 'بانک کلمات خالی است؛ npm run seed را اجرا کنید' })
  }
  return { rounds: words.map((w) => makeRound(w, difficulty)), rules: ML_RULES[difficulty] }
})
