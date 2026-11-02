import { z } from 'zod'
import { buildCategoryRounds, buildOddRounds, buildPairRounds, buildProverbRounds } from '#shared/games/rounds'
import { buildMoshaereRounds, type Verse } from '#shared/games/mosha-ere'
import { buildRiddleRounds, type RiddleRow } from '#shared/games/riddle'
import { buildMapRounds, type MapData } from '#shared/games/iran-map'
import { CP, type ChessPuzzle } from '#shared/games/chess'

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
  if (!q.success) throw createError({ statusCode: 400, message: 'سختی نامعتبر است' })
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
    case 'mosha-ere':
      rounds = buildMoshaereRounds(await getContent<Verse[]>('verses'), d)
      break
    case 'riddle':
      rounds = buildRiddleRounds(await getContent<RiddleRow[]>('riddles'), d)
      break
    case 'iran-map': {
      // نقشه هم همراه دورها فرستاده می‌شود
      const map = await getContent<MapData>('iran-map')
      return { rounds: buildMapRounds(map.provinces, d), map }
    }
    case 'chess-puzzle': {
      const all = await getContent<(ChessPuzzle & { level: number })[]>('chess-puzzles')
      const pool = all.filter((p) => p.level === d)
      rounds = shuffle(pool).slice(0, CP.puzzles[d])
      break
    }
    default:
      throw createError({ statusCode: 404, message: 'بازی یافت نشد' })
  }
  if (!rounds.length) throw createError({ statusCode: 503, message: 'بانک داده خالی است؛ npm run seed را اجرا کنید' })
  return { rounds }
})

function shuffle<T>(a: T[]): T[] {
  const r = [...a]
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[r[i], r[j]] = [r[j]!, r[i]!]
  }
  return r
}
