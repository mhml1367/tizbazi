import { describe, expect, it } from 'vitest'
import * as sm from '../../shared/games/sequence-memory'
import * as rm from '../../shared/games/reverse-memory'

const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296
  return seed / 4294967296
}

describe('حافظه ترتیبی', () => {
  it('دنبالهٔ اولیه ۳تایی است، در محدودهٔ جدول و بدون تکرار پشت‌سرهم', () => {
    const rng = seeded(1)
    for (const d of [1, 2, 3] as const) {
      const cells = sm.SM_RULES[d].grid ** 2
      let seq = sm.initialSequence(cells, rng)
      expect(seq.length).toBe(3)
      for (let r = 2; r <= sm.SM_ROUNDS; r++) {
        seq = sm.extendSequence(seq, cells, rng)
        expect(seq.length).toBe(sm.lengthForRound(r))
      }
      expect(seq.length).toBe(12)
      expect(seq.every((c) => c >= 0 && c < cells)).toBe(true)
      expect(seq.every((c, i) => i === 0 || c !== seq[i - 1])).toBe(true)
    }
  })
  it('امتیاز مرحله و صحت کلیک', () => {
    expect(sm.roundScore(4)).toBe(40)
    expect(sm.isClickCorrect([2, 5], 1, 5)).toBe(true)
    expect(sm.isClickCorrect([2, 5], 1, 4)).toBe(false)
  })
})

describe('حافظه عددی معکوس', () => {
  it('طول ۳ تا ۹ و دورقمی در سخت', () => {
    expect(rm.lengthForRound(1)).toBe(3)
    expect(rm.lengthForRound(rm.RM_ROUNDS)).toBe(9)
    const d = rm.generateDigits(9, true, seeded(2))
    expect(d.every((n) => n >= 10 && n <= 99)).toBe(true)
  })
  it('پارس پاسخ: متصل، جداشده، ارقام فارسی', () => {
    expect(rm.parseAnswer('19274', false)).toEqual([1, 9, 2, 7, 4])
    expect(rm.parseAnswer('۱-۹-۲-۷-۴', false)).toEqual([1, 9, 2, 7, 4])
    expect(rm.parseAnswer('12 45 78', true)).toEqual([12, 45, 78])
    expect(rm.parseAnswer('', false)).toEqual([])
  })
  it('معکوس بودن و امتیاز', () => {
    expect(rm.isReverseCorrect([4, 7, 2, 9, 1], [1, 9, 2, 7, 4])).toBe(true)
    expect(rm.isReverseCorrect([4, 7, 2, 9, 1], [4, 7, 2, 9, 1])).toBe(false)
    expect(rm.roundScore(3)).toBe(45)
  })
})
