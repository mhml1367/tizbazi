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

describe('reactionLines', () => {
  it('جملهٔ مخصوص بازی دارد و برای بازی ناشناخته عمومی است', async () => {
    const { reactionLines, GAME_LINES, TIER_LINES } = await import('../../shared/reaction')
    expect(reactionLines('great', 'stroop')).toBe(GAME_LINES.stroop!.great)
    expect(reactionLines('low', 'نامعلوم')).toBe(TIER_LINES.low)
    expect(reactionLines('record', 'stroop')).toBe(TIER_LINES.record)
  })
  it('هر ۲۲ بازی برای چهار سطح جمله دارد', async () => {
    const { GAME_LINES } = await import('../../shared/reaction')
    const ids = Object.keys(GAME_LINES)
    expect(ids).toHaveLength(22)
    for (const id of ids) for (const t of ['great', 'good', 'low', 'zero'] as const) expect(GAME_LINES[id]![t]!.length).toBeGreaterThan(0)
  })
})
