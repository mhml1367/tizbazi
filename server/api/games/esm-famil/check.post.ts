import { z } from 'zod'
import { EF_CATEGORIES, EF_LETTERS, judge } from '#shared/games/esm-famil'

const ids = EF_CATEGORIES.map((c) => c.id) as [string, ...string[]]
const body = z.object({
  letter: z.enum(EF_LETTERS as [string, ...string[]]),
  answers: z.partialRecord(z.enum(ids), z.string().max(40))
})

// داوری پاسخ‌های «اسم‌فامیل»: تأیید با بانک دسته، و در غیر این صورت با واژه‌نامه (امتیاز کمتر)
export default defineEventHandler(async (event) => {
  await requireUser(event)
  const p = body.safeParse(await readBody(event))
  if (!p.success) throw createError({ statusCode: 400, message: p.error.issues[0]!.message })

  // بانک هر دسته به‌صورت Set (کلیدهای مقایسه در seed ساخته شده‌اند) + ریشه‌های نام خانوادگی
  // از اسم‌ها و شهرها (احمد → احمدی، تهران → تهرانی)
  const { banks, stems } = await getDerived('esm-famil', 'esm-famil-sets', (raw: Record<string, string[]>) => {
    const banks = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, new Set(v)]))
    return { banks, stems: new Set([...banks.name!, ...banks.city!]) }
  })
  const dictionary = await getDictionary()
  const results = Object.entries(p.data.answers).map(([category, answer]) => ({
    category,
    answer: answer ?? '',
    ...judge(answer ?? '', p.data.letter, banks[category] ?? new Set(), dictionary, category === 'family' ? stems : undefined)
  }))
  return { results, total: results.reduce((s, r) => s + r.points, 0) }
})
