// منطق «حافظه عددی معکوس»: دنبالهٔ اعداد نمایش داده می‌شود و کاربر باید آن را وارونه وارد کند

export type Rng = () => number
export type Difficulty = 1 | 2 | 3

export const RM_RULES: Record<Difficulty, { showMs: number; twoDigit: boolean }> = {
  1: { showMs: 1000, twoDigit: false },
  2: { showMs: 700, twoDigit: false },
  3: { showMs: 500, twoDigit: true }
}
export const RM_GAP_MS = 200
export const RM_START_LENGTH = 3
export const RM_MAX_LENGTH = 9
export const RM_ROUNDS = RM_MAX_LENGTH - RM_START_LENGTH + 1

export const lengthForRound = (round: number) => RM_START_LENGTH + round - 1

/** ارقام تک‌رقمی (۰–۹) یا دورقمی (۱۰–۹۹)؛ دو عدد پشت‌سرهم یکسان نمی‌آید */
export function generateDigits(length: number, twoDigit: boolean, rng: Rng = Math.random): number[] {
  const out: number[] = []
  const draw = () => (twoDigit ? 10 + Math.floor(rng() * 90) : Math.floor(rng() * 10))
  while (out.length < length) {
    const v = draw()
    if (out[out.length - 1] !== v) out.push(v)
  }
  return out
}

const toEn = (s: string) =>
  s.replace(/[۰-۹]/g, (c) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c))).replace(/[٠-٩]/g, (c) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(c)))

/** ورودی کاربر را به آرایهٔ عدد تبدیل می‌کند. تک‌رقمی: «۱۹۲۷۴» یا «۱-۹-۲-۷-۴»؛ دورقمی: با جداکننده */
export function parseAnswer(input: string, twoDigit: boolean): number[] {
  const s = toEn(input).trim()
  if (!s) return []
  if (/\D/.test(s)) return s.split(/\D+/).filter(Boolean).map(Number)
  return twoDigit ? [Number(s)] : Array.from(s).map(Number)
}

export const isReverseCorrect = (seq: number[], answer: number[]) => {
  const rev = [...seq].reverse()
  return rev.length === answer.length && rev.every((v, i) => v === answer[i])
}

/** هر مرحلهٔ درست: شمارهٔ مرحله × ۱۵ */
export const roundScore = (round: number) => round * 15
