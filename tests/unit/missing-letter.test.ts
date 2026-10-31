import { describe, expect, it } from 'vitest'
import { ML_RULES, isRoundCorrect, makeRound, pickWords, roundScore } from '../../shared/games/missing-letter'

const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296
  return seed / 4294967296
}

describe('حرف گمشده', () => {
  it('تعداد حروف گمشده مطابق سختی است و پاسخ با کلمه می‌خواند', () => {
    const rng = seeded(7)
    for (const d of [1, 2, 3] as const) {
      const word = 'بیمارستان'.slice(0, ML_RULES[d].minLen)
      const r = makeRound(word, d, rng)
      expect(r.hidden.length).toBe(ML_RULES[d].missing)
      expect(r.answer).toEqual(r.hidden.map((i) => Array.from(word)[i]))
      for (const a of r.answer) expect(r.options).toContain(a)
    }
  })

  it('گزینه‌ها تکراری نیستند', () => {
    const r = makeRound('کتابخانه', 3, seeded(3))
    expect(new Set(r.options).size).toBe(r.options.length)
  })

  it('pickWords فقط کلمات با طول مجاز و یکتا برمی‌گرداند', () => {
    const bank = ['در', 'میز', 'کتاب', 'مداد', 'دفتر', 'خودکار', 'کتابخانه', 'کتاب']
    const w = pickWords(bank, 1, 10, seeded(1))
    expect(w.every((x) => Array.from(x).length === 4)).toBe(true)
  })

  it('اعتبارسنجی و امتیاز', () => {
    const r = makeRound('کتاب', 1, seeded(5))
    expect(isRoundCorrect(r, r.answer)).toBe(true)
    expect(isRoundCorrect(r, ['ز'])).toBe(false)
    expect(roundScore(true, 9.7)).toBe(19)
    expect(roundScore(false, 12)).toBe(0)
  })
})
