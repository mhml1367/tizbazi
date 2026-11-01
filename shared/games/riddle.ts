// منطق «چیستان»: ۴ گزینه، و راهنما که دو گزینهٔ غلط را حذف می‌کند (با نصف امتیاز)
export type Rng = () => number
export type Difficulty = 1 | 2 | 3

export interface RiddleRow {
  q: string
  answer: string
  level: number
}
export interface RiddleRound {
  q: string
  answer: string
  options: string[]
}

export const RD = { rounds: 10, seconds: 25 }

const shuffle = <T>(a: readonly T[], rng: Rng): T[] => {
  const r = [...a]
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[r[i], r[j]] = [r[j]!, r[i]!]
  }
  return r
}

/** سؤال‌ها از سطح سختی (و در صورت کمبود از سطح‌های دیگر)؛ گزینه‌های غلط از جواب چیستان‌های دیگر */
export function buildRiddleRounds(rows: RiddleRow[], difficulty: Difficulty, n = RD.rounds, rng: Rng = Math.random): RiddleRound[] {
  const pool = shuffle(
    rows.filter((r) => r.level === difficulty),
    rng
  )
  const rest = shuffle(
    rows.filter((r) => r.level !== difficulty),
    rng
  )
  const chosen = [...pool, ...rest].slice(0, n)
  const answers = [...new Set(rows.map((r) => r.answer))]
  return chosen.map((r) => {
    const wrong = shuffle(
      answers.filter((a) => a !== r.answer),
      rng
    ).slice(0, 3)
    return { q: r.q, answer: r.answer, options: shuffle([r.answer, ...wrong], rng) }
  })
}

/** دو گزینهٔ غلط برای حذف (راهنما) */
export function hintRemovals(round: RiddleRound, rng: Rng = Math.random): string[] {
  return shuffle(
    round.options.filter((o) => o !== round.answer),
    rng
  ).slice(0, 2)
}

/** درست: ۱۵ + ثلث ثانیه‌های باقی‌مانده؛ با راهنما نصف */
export function riddleDelta(ok: boolean, secondsLeft: number, usedHint: boolean) {
  if (!ok) return 0
  const base = 15 + Math.floor(Math.max(0, secondsLeft) / 3)
  return usedHint ? Math.floor(base / 2) : base
}
