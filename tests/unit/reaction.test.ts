import { describe, expect, it } from 'vitest'
import { TIER_EMOJI, TIER_LINES, pickBySeed, resultTier } from '../../shared/reaction'

describe('واکنش صفحهٔ نتیجه', () => {
  it('سطح بر اساس آستانه‌ها', () => {
    expect(resultTier(0, 40, 90)).toBe('zero')
    expect(resultTier(10, 40, 90)).toBe('low')
    expect(resultTier(40, 40, 90)).toBe('good')
    expect(resultTier(95, 40, 90)).toBe('great')
  })
  it('رکورد فقط با امتیاز دست‌کم «خوب» جشن گرفته می‌شود', () => {
    expect(resultTier(50, 40, 90, { prevBest: 30, isNew: true })).toBe('record')
    expect(resultTier(95, 40, 90, { prevBest: 30, isNew: true })).toBe('record')
    expect(resultTier(10, 40, 90, { prevBest: 5, isNew: true })).toBe('low')
    expect(resultTier(95, 40, 90, { prevBest: 200, isNew: false })).toBe('great')
    expect(resultTier(95, 40, 90, { prevBest: null, isNew: false })).toBe('great')
  })
  it('هر سطح شکلک و پیام دارد و انتخاب با بذر ثابت است', () => {
    for (const t of ['record', 'great', 'good', 'low', 'zero'] as const) {
      expect(TIER_EMOJI[t].length).toBeGreaterThan(0)
      expect(TIER_LINES[t].length).toBeGreaterThan(0)
      expect(pickBySeed(TIER_LINES[t], 7)).toBe(pickBySeed(TIER_LINES[t], 7))
    }
  })
})
