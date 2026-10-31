import { describe, expect, it } from 'vitest'
import { CC_RULES, chainScore, chainText, evaluate, generateChain } from '../../shared/games/chain-calc'

const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296
  return seed / 4294967296
}

describe('محاسبات ذهنی', () => {
  it('ارزیابی چپ‌به‌راست است، نه اولویت استاندارد', () => {
    // ۱۲ + ۷ − ۴ × ۲ → ((۱۲+۷)−۴)×۲ = ۳۰ (نه ۱۸)
    expect(
      evaluate(12, [
        { op: '+', n: 7 },
        { op: '−', n: 4 },
        { op: '×', n: 2 }
      ])
    ).toBe(30)
  })

  it('تعداد عملیات مطابق سختی و همهٔ نتایج میانی غیرمنفی‌اند', () => {
    const rng = seeded(9)
    for (let i = 0; i < 400; i++) {
      const d = ((i % 3) + 1) as 1 | 2 | 3
      const c = generateChain(d, rng)
      expect(c.steps.length).toBe(CC_RULES[d].ops)
      let cur = c.start
      for (const s of c.steps) {
        cur = evaluate(cur, [s])
        expect(cur).toBeGreaterThanOrEqual(0)
      }
      expect(cur).toBe(c.answer)
      expect(evaluate(c.start, c.steps)).toBe(c.answer)
    }
  })

  it('متن و امتیاز', () => {
    expect(chainText({ start: 12, steps: [{ op: '+', n: 7 }], answer: 19 })).toBe('12 + 7')
    expect(chainScore(true, 10)).toBe(25)
    expect(chainScore(false, 10)).toBe(0)
  })
})
