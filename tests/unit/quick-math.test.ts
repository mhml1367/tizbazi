import { describe, expect, it } from 'vitest'
import { answerScore, generateQuestion, makeExpression } from '../../shared/games/quick-math'

const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296
  return seed / 4294967296
}

// ارزیابی عبارت نمایشی برای اطمینان از درستی جواب تولیدشده
const evalText = (t: string) => Function(`return (${t.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-')})`)()

describe('محاسبات سریع', () => {
  it('جواب با عبارت می‌خواند و هرگز منفی یا غیرصحیح نیست (همهٔ سختی‌ها)', () => {
    const rng = seeded(11)
    for (let i = 0; i < 600; i++) {
      const { text, answer } = makeExpression(((i % 3) + 1) as 1 | 2 | 3, rng)
      expect(evalText(text)).toBe(answer)
      expect(Number.isInteger(answer)).toBe(true)
      expect(answer).toBeGreaterThanOrEqual(0)
    }
  })

  it('۴ گزینهٔ یکتا که شامل جواب است', () => {
    const rng = seeded(5)
    for (let i = 0; i < 300; i++) {
      const q = generateQuestion(((i % 3) + 1) as 1 | 2 | 3, rng)
      expect(q.options.length).toBe(4)
      expect(new Set(q.options).size).toBe(4)
      expect(q.options).toContain(q.answer)
      expect(q.options.every((o) => o >= 0)).toBe(true)
    }
  })

  it('امتیاز: ۵ + بونوس سرعت، غلط صفر', () => {
    expect(answerScore(true, 500)).toBe(10)
    expect(answerScore(true, 2500)).toBe(8)
    expect(answerScore(true, 9000)).toBe(5)
    expect(answerScore(false, 100)).toBe(0)
  })
})
