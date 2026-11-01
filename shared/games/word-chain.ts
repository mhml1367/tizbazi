// منطق «زنجیرهٔ کلمات»: هر کلمه باید با حرف آخر کلمهٔ قبلی شروع شود
import { compareKey, firstLetter, lastLetter, lettersOf } from '../persian'

export type Rng = () => number
export type Difficulty = 1 | 2 | 3

export const WC = { lives: 3, seconds: { 1: 20, 2: 15, 3: 10 } as Record<Difficulty, number>, minLength: 3 }

/** حروفی که کلمه‌های کمی با آن‌ها شروع می‌شوند (در سختی آسان، رایانه کلمه‌ای با این پایان نمی‌دهد) */
export const RARE_START = new Set(Array.from('ثذژضطظغصعحقئءؤ'))

export type ChainError = 'short' | 'letter' | 'used' | 'unknown'

/** اعتبارسنجی کلمهٔ کاربر */
export function checkWord(word: string, prev: string | null, used: Set<string>, dictionary: Set<string>): ChainError | null {
  const key = compareKey(word)
  if (lettersOf(key).length < WC.minLength) return 'short'
  if (prev && firstLetter(key) !== lastLetter(prev)) return 'letter'
  if (used.has(key)) return 'used'
  if (!dictionary.has(key)) return 'unknown'
  return null
}

/**
 * پاسخ رایانه: کلمه‌ای رایج که با حرف لازم شروع شود و تکراری نباشد.
 * آسان: پایان با حرف رایج · سخت: ترجیح پایان با حرف کم‌کاربرد تا کار کاربر سخت شود
 */
export function computerReply(
  letter: string,
  used: Set<string>,
  bank: string[],
  difficulty: Difficulty,
  rng: Rng = Math.random
): string | null {
  const cands = bank.filter((w) => firstLetter(w) === letter && !used.has(compareKey(w)) && lettersOf(w).length >= WC.minLength)
  if (!cands.length) return null
  let pool = cands
  if (difficulty === 1) pool = cands.filter((w) => !RARE_START.has(lastLetter(w)))
  if (difficulty === 3) {
    const hard = cands.filter((w) => RARE_START.has(lastLetter(w)))
    if (hard.length) pool = hard
  }
  if (!pool.length) pool = cands
  return pool[Math.floor(rng() * pool.length)]!
}

/** امتیاز هر کلمهٔ درست: ۵ + ۲ برای هر حرف بیش از ۳ */
export const wordPoints = (word: string) => 5 + Math.max(0, lettersOf(word).length - 3) * 2
/** وقتی رایانه کلمه‌ای پیدا نکند، کاربر برنده است */
export const STUMP_BONUS = 30
