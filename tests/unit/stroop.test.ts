import { describe, expect, it } from 'vitest'
import { computeAccuracy, computeScore, generateQuestion, isCorrect } from '../../shared/games/stroop'

// مولد تصادفی قطعی برای تست
const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296
  return seed / 4294967296
}

describe('استروپ: تولید سؤال', () => {
  it('رنگ متن همیشه با معنای کلمه فرق دارد و جهت کلمه با جهت فلش', () => {
    const rng = seeded(1)
    for (let i = 0; i < 500; i++) {
      const q = generateQuestion(((i % 3) + 1) as 1 | 2 | 3, rng)
      expect(q.inkColor).not.toBe(q.wordColor)
      expect(q.wordDir).not.toBe(q.arrowDir)
    }
  })

  it('آسان فقط رنگ می‌پرسد و از ۴ رنگ اول استفاده می‌کند', () => {
    const rng = seeded(2)
    for (let i = 0; i < 200; i++) {
      const q = generateQuestion(1, rng)
      expect(q.kind).toBe('color')
      expect(['red', 'blue', 'green', 'yellow']).toContain(q.inkColor)
    }
  })

  it('سخت هر دو بُعد را همزمان می‌پرسد', () => {
    const q = generateQuestion(3, seeded(3))
    expect(q.kind).toBe('both')
    expect(q.answer.color).toBe(q.inkColor)
    expect(q.answer.direction).toBe(q.arrowDir)
  })
})

describe('استروپ: اعتبارسنجی پاسخ', () => {
  it('در حالت both هر دو بُعد باید درست باشد', () => {
    const q = generateQuestion(3, seeded(4))
    expect(isCorrect(q, { color: q.inkColor, direction: q.arrowDir })).toBe(true)
    expect(isCorrect(q, { color: q.inkColor })).toBe(false)
    expect(isCorrect(q, { color: q.wordColor, direction: q.arrowDir })).toBe(false)
  })
})

describe('استروپ: امتیاز', () => {
  it('درست − نصف غلط، هرگز منفی نمی‌شود', () => {
    expect(computeScore(10, 4)).toBe(8)
    expect(computeScore(1, 10)).toBe(0)
  })
  it('دقت درصدی', () => {
    expect(computeAccuracy(3, 1)).toBe(75)
    expect(computeAccuracy(0, 0)).toBe(0)
  })
})
