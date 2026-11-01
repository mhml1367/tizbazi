import { z } from 'zod'

// z.coerce.boolean رشتهٔ «false» را هم true می‌کند؛ فقط «1» یا «true» درست است
const query = z.object({
  mode: z.enum(['daily', 'practice']).default('daily'),
  fresh: z
    .string()
    .optional()
    .transform((v) => v === '1' || v === 'true')
})

// وضعیت «کلمه‌روز» کاربر (روزانه یا تمرینی)
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const q = query.safeParse(getQuery(event))
  if (!q.success) throw createError({ statusCode: 400, statusMessage: q.error.issues[0]!.message })
  return publicPuzzle(await getPuzzle(user.id, q.data.mode, q.data.mode === 'practice' && q.data.fresh))
})
