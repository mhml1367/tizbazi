import { scoreSchema } from '#shared/validation'

// محدودیت نرخ: حداکثر یک ذخیره در ۳ ثانیه برای هر کاربر (حافظهٔ پردازش)
const lastSave = new Map<string, number>()
const MIN_GAP_MS = 3000

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const p = scoreSchema.safeParse(await readBody(event))
  if (!p.success) throw createError({ statusCode: 400, message: p.error.issues[0]!.message })

  const now = Date.now()
  if (now - (lastSave.get(user.id) ?? 0) < MIN_GAP_MS) {
    throw createError({ statusCode: 429, message: 'درخواست‌ها بیش از حد سریع است' })
  }
  lastSave.set(user.id, now)

  return recordScore(user.id, p.data)
})
