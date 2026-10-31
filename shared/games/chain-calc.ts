// منطق «محاسبات ذهنی»: زنجیرهٔ عملیات که چپ‌به‌راست (نه با اولویت استاندارد) حل می‌شود

export type Rng = () => number
export type Difficulty = 1 | 2 | 3
export type Op = '+' | '−' | '×'

export const CC_LIMITS = { chains: 10, secondsPerChain: 30 }
export const CC_RULES: Record<Difficulty, { ops: number; max: number }> = {
  1: { ops: 3, max: 20 },
  2: { ops: 4, max: 50 },
  3: { ops: 5, max: 100 }
}

export interface Chain {
  start: number
  steps: { op: Op; n: number }[]
  answer: number
}

const int = (min: number, max: number, rng: Rng) => min + Math.floor(rng() * (max - min + 1))

/** ارزیابی چپ‌به‌راست */
export function evaluate(start: number, steps: { op: Op; n: number }[]): number {
  return steps.reduce((acc, s) => (s.op === '+' ? acc + s.n : s.op === '−' ? acc - s.n : acc * s.n), start)
}

/** نتیجهٔ میانی هرگز منفی نمی‌شود و ضرب‌کننده کوچک می‌ماند تا زنجیره از دست خارج نشود */
export function generateChain(difficulty: Difficulty, rng: Rng = Math.random): Chain {
  const { ops, max } = CC_RULES[difficulty]
  const start = int(1, max, rng)
  const steps: Chain['steps'] = []
  let cur = start
  for (let i = 0; i < ops; i++) {
    const r = rng()
    if (r < 0.4) {
      const n = int(1, max, rng)
      steps.push({ op: '+', n })
      cur += n
    } else if (r < 0.75 && cur > 1) {
      const n = int(1, Math.min(max, cur), rng)
      steps.push({ op: '−', n })
      cur -= n
    } else {
      const n = int(2, cur > 200 ? 2 : Math.min(9, Math.max(2, Math.floor(max / 10))), rng)
      steps.push({ op: '×', n })
      cur *= n
    }
  }
  return { start, steps, answer: cur }
}

/** عبارت نمایشی بدون علامت مساوی */
export const chainText = (c: Chain) => [c.start, ...c.steps.flatMap((s) => [s.op, s.n])].join(' ')

/** پاسخ درست ۲۰ امتیاز + نصف ثانیه‌های باقی‌مانده (گرد به پایین) */
export const chainScore = (correct: boolean, secondsLeft: number) => (correct ? 20 + Math.floor(Math.max(0, secondsLeft) / 2) : 0)
