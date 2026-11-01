// منطق «رمزشکن» (Mastermind عددی): بعد از هر حدس، تعداد ارقامِ درستِ سر جا و درستِ جابه‌جا
export type Rng = () => number
export type Difficulty = 1 | 2 | 3

export const CB_RULES: Record<Difficulty, { length: number; attempts: number; repeats: boolean }> = {
  1: { length: 3, attempts: 10, repeats: false },
  2: { length: 4, attempts: 10, repeats: false },
  3: { length: 4, attempts: 8, repeats: true }
}

export function makeSecret(difficulty: Difficulty, rng: Rng = Math.random): number[] {
  const { length, repeats } = CB_RULES[difficulty]
  const out: number[] = []
  while (out.length < length) {
    const d = Math.floor(rng() * 10)
    if (repeats || !out.includes(d)) out.push(d)
  }
  return out
}

/** exact = رقم درست سر جای درست · present = رقم درست در جای دیگر (با رعایت تکرار) */
export function feedback(secret: number[], guess: number[]): { exact: number; present: number } {
  let exact = 0
  const s = new Map<number, number>()
  const g = new Map<number, number>()
  secret.forEach((d, i) => {
    if (guess[i] === d) exact++
    else {
      s.set(d, (s.get(d) ?? 0) + 1)
      g.set(guess[i]!, (g.get(guess[i]!) ?? 0) + 1)
    }
  })
  let present = 0
  for (const [d, n] of g) present += Math.min(n, s.get(d) ?? 0)
  return { exact, present }
}

/** حدس معتبر: طول درست، فقط رقم، و بدون تکرار وقتی تکرار مجاز نیست */
export function validGuess(guess: number[], difficulty: Difficulty): boolean {
  const { length, repeats } = CB_RULES[difficulty]
  return (
    guess.length === length && guess.every((d) => Number.isInteger(d) && d >= 0 && d <= 9) && (repeats || new Set(guess).size === length)
  )
}

/** امتیاز: حل‌شده → ۲۰ × سختی + ۱۰ برای هر تلاشِ باقی‌مانده · حل‌نشده → ۰ */
export const codeScore = (solved: boolean, difficulty: Difficulty, attemptsUsed: number) =>
  solved ? 20 * difficulty + 10 * (CB_RULES[difficulty].attempts - attemptsUsed) : 0
