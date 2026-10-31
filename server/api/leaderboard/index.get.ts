import { z } from 'zod'
import { GAME_IDS } from '#shared/validation'
import { PERIODS } from '#shared/periods'

const query = z.object({
  gameId: z.enum(['all', 'mix', ...GAME_IDS]).default('all'),
  period: z.enum(PERIODS).default('all')
})

// GET /api/leaderboard?gameId=&period=  (period: today | week | month | year | all)
export default defineEventHandler(async (event) => {
  const q = query.safeParse(getQuery(event))
  if (!q.success) throw createError({ statusCode: 400, statusMessage: q.error.issues[0]!.message })
  const me = await getSessionUser(event)
  const rows = await leaderboardRows(prisma, q.data.gameId, q.data.period)
  return { gameId: q.data.gameId, period: q.data.period, meId: me?.id ?? null, rows }
})
