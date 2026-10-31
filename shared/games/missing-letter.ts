// منطق بازی «حرف گمشده»؛ مستقل از UI و دیتابیس

export type Rng = () => number
export type Difficulty = 1 | 2 | 3

export const ML_LIMITS = { rounds: 10, secondsPerWord: 15 }

/** آسان: ۴ حرفی با ۱ گمشده · متوسط: ۵–۶ حرفی با ۲ گمشده · سخت: ۷+ حرفی با ۳ گمشده */
export const ML_RULES: Record<Difficulty, { minLen: number; maxLen: number; missing: number }> = {
  1: { minLen: 4, maxLen: 4, missing: 1 },
  2: { minLen: 5, maxLen: 6, missing: 2 },
  3: { minLen: 7, maxLen: 9, missing: 3 }
}

const ALPHABET = Array.from('ابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی')

export interface MissingRound {
  word: string
  /** اندیس حروف گمشده (صعودی) */
  hidden: number[]
  /** حروف گمشده به ترتیب اندیس */
  answer: string[]
  /** گزینه‌های انتخابی (حروف گمشده + مزاحم‌ها، بُرخورده) */
  options: string[]
}

const shuffle = <T>(arr: T[], rng: Rng): T[] => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

export function makeRound(word: string, difficulty: Difficulty, rng: Rng = Math.random): MissingRound {
  const letters = Array.from(word)
  const count = Math.min(ML_RULES[difficulty].missing, letters.length - 1)
  const hidden = shuffle(
    letters.map((_, i) => i),
    rng
  )
    .slice(0, count)
    .sort((a, b) => a - b)
  const answer = hidden.map((i) => letters[i]!)
  const pool = ALPHABET.filter((l) => !answer.includes(l))
  const extra = shuffle(pool, rng).slice(0, 4 + (3 - count))
  return { word, hidden, answer, options: shuffle([...answer, ...extra], rng) }
}

/** انتخاب تصادفی کلمات یکتا از بانک، مطابق طول مجاز سختی */
export function pickWords(bank: string[], difficulty: Difficulty, n: number, rng: Rng = Math.random): string[] {
  const { minLen, maxLen } = ML_RULES[difficulty]
  const ok = bank.filter((w) => {
    const len = Array.from(w).length
    return len >= minLen && len <= maxLen
  })
  return shuffle(ok, rng).slice(0, n)
}

export const isRoundCorrect = (round: MissingRound, given: string[]) =>
  given.length === round.answer.length && given.every((g, i) => g === round.answer[i])

/** هر کلمهٔ درست ۱۰ امتیاز + یک امتیاز به‌ازای هر ثانیهٔ باقی‌مانده */
export const roundScore = (correct: boolean, secondsLeft: number) => (correct ? 10 + Math.max(0, Math.floor(secondsLeft)) : 0)
