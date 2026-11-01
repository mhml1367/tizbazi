import { z } from 'zod'
import { compareKey, lastLetter, normalizeFa } from '#shared/persian'
import { RARE_START, checkWord, computerReply } from '#shared/games/word-chain'

const body = z.object({
  difficulty: z.number().int().min(1).max(3),
  history: z.array(z.string().max(30)).max(400),
  word: z.string().max(30).optional()
})

/**
 * یک نوبت «زنجیرهٔ کلمات». بدون word: کلمهٔ شروع رایانه. با word: اعتبارسنجی کلمهٔ کاربر و پاسخ رایانه.
 * وضعیت بازی (history) از کلاینت می‌آید؛ این بازی امتیازش را مثل بقیه از طریق /api/scores ثبت می‌کند.
 */
export default defineEventHandler(async (event) => {
  await requireUser(event)
  const p = body.safeParse(await readBody(event))
  if (!p.success) throw createError({ statusCode: 400, statusMessage: p.error.issues[0]!.message })
  const { difficulty, history, word } = p.data
  const d = difficulty as 1 | 2 | 3

  // کلمه‌های رایانه: اسم‌های عام شناخته‌شده (حیوان، غذا، میوه، رنگ، اشیا، کشور و شهرهای مشهور)
  const bank = await getContent<string[]>('chain-words')
  const used = new Set(history.map(compareKey))

  if (word === undefined) {
    // کلمهٔ شروع: رایج و با پایانی که شروع‌کردن با آن آسان است
    const starts = bank.filter((w) => !RARE_START.has(lastLetter(w)) && !used.has(compareKey(w)))
    return { ok: true, reply: starts[Math.floor(Math.random() * starts.length)] ?? null }
  }

  const prev = history.length ? history[history.length - 1]! : null
  // کلمهٔ کاربر: واژه‌نامه + همان بانک رایانه (مثل «چلوکباب» که در واژه‌نامه نیست)
  const dict = await getDictionary()
  // (با تغییر بانک رایانه دوباره ساخته می‌شود؛ واژه‌نامه عملاً ثابت است)
  const known = await getDerived('chain-words', 'chain-known', (b: string[]) => new Set([...dict, ...b.map(compareKey)]))
  const error = checkWord(word, prev, used, known)
  if (error) return { ok: false, error }

  used.add(compareKey(word))
  const reply = computerReply(lastLetter(word), used, bank, d)
  return { ok: true, word: normalizeFa(word), reply }
})
