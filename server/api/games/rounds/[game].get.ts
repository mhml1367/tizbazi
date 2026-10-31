import { z } from 'zod'
import { buildCategoryRounds, buildOddRounds, buildPairRounds, buildProverbRounds } from '#shared/games/rounds'

const query = z.object({ difficulty: z.coerce.number().int().min(1).max(3).default(1) })

// بانک‌ها یک‌بار از دیتابیس خوانده و در حافظه نگه داشته می‌شوند
const cache = new Map<string, unknown>()
async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  if (!cache.has(key)) cache.set(key, await load())
  return cache.get(key) as T
}

export default defineEventHandler(async (event) => {
  await requireUser(event)
  const game = getRouterParam(event, 'game')
  const q = query.safeParse(getQuery(event))
  if (!q.success) throw createError({ statusCode: 400, statusMessage: 'سختی نامعتبر است' })
  const d = q.data.difficulty as 1 | 2 | 3

  let rounds: unknown[]
  switch (game) {
    case 'quick-category': {
      const bank = await cached('cat', async () => {
        const rows = await prisma.categoryWord.findMany()
        const out: Record<string, string[]> = {}
        for (const r of rows) (out[r.category] ??= []).push(r.text)
        return out
      })
      rounds = buildCategoryRounds(bank)
      break
    }
    case 'synonym-antonym': {
      const rows = await cached('pairs', () => prisma.wordPair.findMany())
      rounds = buildPairRounds(rows, d)
      break
    }
    case 'proverb': {
      const rows = await cached('proverbs', () => prisma.proverb.findMany())
      rounds = buildProverbRounds(rows, d)
      break
    }
    case 'odd-one-out': {
      const rows = await cached('groups', () => prisma.oddGroup.findMany())
      rounds = buildOddRounds(rows, d)
      break
    }
    default:
      throw createError({ statusCode: 404, statusMessage: 'بازی یافت نشد' })
  }
  if (!rounds.length) throw createError({ statusCode: 503, statusMessage: 'بانک داده خالی است؛ npm run seed را اجرا کنید' })
  return { rounds }
})
