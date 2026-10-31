import { describe, expect, it } from 'vitest'
import { periodStart, tehranMidnight } from '../../shared/periods'
import { dailyChallenge } from '../../shared/daily'
import { advanceStreak, earnedAchievements, levelFromXp, streakBonus, tehranDayKey, xpForLevel } from '../../shared/gamification'

// ساعت ۰۰:۰۰ تهران = ۲۰:۳۰ روز قبل به UTC
const tehran = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d) - 3.5 * 3_600_000)

describe('بازه‌های زمانی (تهران، شمسی)', () => {
  const sat = new Date('2026-10-31T12:00:00Z') // شنبه ۹ آبان ۱۴۰۵
  it('امروز', () => expect(periodStart('today', sat)).toEqual(tehran(2026, 10, 31)))
  it('هفته از شنبه شروع می‌شود (روز شنبه خودش شروع است)', () => {
    expect(periodStart('week', sat)).toEqual(tehran(2026, 10, 31))
    expect(periodStart('week', new Date('2026-11-04T12:00:00Z'))).toEqual(tehran(2026, 10, 31)) // چهارشنبه
    expect(periodStart('week', new Date('2026-11-06T12:00:00Z'))).toEqual(tehran(2026, 10, 31)) // جمعه
    expect(periodStart('week', new Date('2026-11-07T12:00:00Z'))).toEqual(tehran(2026, 11, 7)) // شنبهٔ بعد
  })
  it('ماه شمسی: ۱ آبان ۱۴۰۵ = ۲۳ اکتبر ۲۰۲۶', () => expect(periodStart('month', sat)).toEqual(tehran(2026, 10, 23)))
  it('سال شمسی: ۱ فروردین ۱۴۰۵ = ۲۱ مارس ۲۰۲۶', () => expect(periodStart('year', sat)).toEqual(tehran(2026, 3, 21)))
  it('کل زمان فیلتر ندارد', () => expect(periodStart('all', sat)).toBeNull())
  it('نیمه‌شب تهران: ساعت ۲۱:۰۰ UTC هنوز همان روز تهران است', () => {
    expect(tehranMidnight(new Date('2026-10-31T20:00:00Z'))).toEqual(tehran(2026, 10, 31))
    expect(tehranMidnight(new Date('2026-10-31T21:00:00Z'))).toEqual(tehran(2026, 11, 1))
  })
})

describe('چالش روزانه', () => {
  it('قطعی، ۳ بازی متمایز، و بین روزها متفاوت', () => {
    const a = dailyChallenge('2026-10-31')
    expect(dailyChallenge('2026-10-31')).toEqual(a)
    expect(new Set(a).size).toBe(3)
    const days = Array.from({ length: 30 }, (_, i) => dailyChallenge(`2026-11-${String(i + 1).padStart(2, '0')}`).join())
    expect(new Set(days).size).toBeGreaterThan(5)
  })
})

describe('گیمیفیکیشن', () => {
  it('سطح: ⌊√(xp/100)⌋+1 و معکوسش', () => {
    expect(levelFromXp(0)).toBe(1)
    expect(levelFromXp(99)).toBe(1)
    expect(levelFromXp(100)).toBe(2)
    expect(levelFromXp(400)).toBe(3)
    expect(xpForLevel(3)).toBe(400)
  })
  it('پاداش streak با سقف ۵۰۰', () => {
    expect(streakBonus(1)).toBe(60)
    expect(streakBonus(100)).toBe(500)
  })
  it('streak: همان روز بدون تغییر، روز بعد +۱، فاصله ریست', () => {
    expect(advanceStreak(3, 5, '2026-10-31', '2026-10-31')).toEqual({ current: 3, longest: 5, advanced: false })
    expect(advanceStreak(3, 5, '2026-10-30', '2026-10-31')).toEqual({ current: 4, longest: 5, advanced: true })
    expect(advanceStreak(5, 5, '2026-10-30', '2026-10-31').longest).toBe(6)
    expect(advanceStreak(9, 9, '2026-10-28', '2026-10-31')).toEqual({ current: 1, longest: 9, advanced: true })
    expect(advanceStreak(0, 0, null, '2026-10-31')).toEqual({ current: 1, longest: 1, advanced: true })
  })
  it('کلید روز تهران', () => {
    expect(tehranDayKey(new Date('2026-10-31T20:00:00Z'))).toBe('2026-10-31')
    expect(tehranDayKey(new Date('2026-10-31T21:00:00Z'))).toBe('2026-11-01')
  })
  it('نشان‌ها', () => {
    const base = { totalGames: 1, distinctGames: 1, streak: 1, rawScore: 10, gameId: 'quick-math' }
    expect(earnedAchievements(base)).toEqual(['first-step'])
    expect(earnedAchievements({ ...base, streak: 7, rawScore: 1000, totalGames: 100, distinctGames: 10, leader: true })).toEqual(
      expect.arrayContaining(['streak-7', 'mind-awake', 'hard-worker', 'all-rounder', 'leader'])
    )
    expect(earnedAchievements({ ...base, gameId: 'stroop', fastestCorrectMs: 2999 })).toContain('speedster')
    expect(earnedAchievements({ ...base, gameId: 'stroop', fastestCorrectMs: 3000 })).not.toContain('speedster')
    expect(earnedAchievements({ ...base, gameId: 'quick-math', fastestCorrectMs: 500 })).not.toContain('speedster')
  })
})
