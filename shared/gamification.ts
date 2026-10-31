// منطق خالص گیمیفیکیشن؛ بدون وابستگی به دیتابیس تا قابل تست واحد باشد

/** سطح = ⌊√(xp/100)⌋ + 1 */
export const levelFromXp = (xp: number) => Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1

/** XP لازم برای رسیدن به یک سطح */
export const xpForLevel = (level: number) => (level - 1) ** 2 * 100

/** پاداش XP روزانهٔ streak: ۵۰ + streak×۱۰ با سقف ۵۰۰ */
export const streakBonus = (streak: number) => Math.min(500, 50 + streak * 10)

const TZ = 'Asia/Tehran'
const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' })

/** کلید روز (YYYY-MM-DD) به وقت تهران */
export const tehranDayKey = (d: Date = new Date()) => dayFmt.format(d)

const dayNumber = (key: string) => {
  const [y, m, d] = key.split('-').map(Number)
  return Math.floor(Date.UTC(y!, m! - 1, d!) / 86_400_000)
}

export interface StreakState {
  current: number
  longest: number
  /** آیا امروز streak افزایش یافت (برای پاداش یک‌بار در روز) */
  advanced: boolean
}

/** به‌روزرسانی streak: همان روز بدون تغییر، روز بعد +۱، فاصلهٔ بیشتر ریست به ۱ */
export function advanceStreak(current: number, longest: number, lastDay: string | null, today: string): StreakState {
  if (lastDay === today) return { current, longest, advanced: false }
  const consecutive = lastDay !== null && dayNumber(today) - dayNumber(lastDay) === 1
  const next = consecutive ? current + 1 : 1
  return { current: next, longest: Math.max(longest, next), advanced: true }
}

export interface AchievementDef {
  id: string
  title: string
  description: string
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first-step', title: 'اولین قدم', description: 'اولین بازی را انجام دادی' },
  { id: 'streak-7', title: 'پشت‌هم‌پشت', description: 'streak ۷ روزه' },
  { id: 'streak-30', title: 'ماه‌استوار', description: 'streak ۳۰ روزه' },
  { id: 'mind-awake', title: 'ذهن بیدار', description: '۱۰۰۰ امتیاز در یک بازی' },
  { id: 'all-rounder', title: 'همه‌کاره', description: 'هر ۱۰ بازی را حداقل یک‌بار بازی کردی' },
  { id: 'speedster', title: 'سرعت‌سنج', description: 'پاسخ درست زیر ۳ ثانیه در استروپ' },
  { id: 'hard-worker', title: 'سخت‌کوش', description: '۱۰۰ بازی انجام دادی' },
  { id: 'leader', title: 'صدرنشین', description: 'اول شدن در لیدربورد هفتگی' }
]

/** پاداش XP: تکمیل هر چالش روزانه و تکمیل هر سه */
export const DAILY_BADGE_XP = 30
export const DAILY_ALL_BONUS_XP = 100

export interface AchievementContext {
  /** اول بودن در لیدربورد هفتگی (با حداقل دو بازیکن) */
  leader?: boolean
  totalGames: number
  distinctGames: number
  streak: number
  rawScore: number
  gameId: string
  fastestCorrectMs?: number
}

/** شناسهٔ نشان‌هایی که با این وضعیت شرطشان برقرار است (نه لزوماً جدید) */
export function earnedAchievements(c: AchievementContext): string[] {
  const out: string[] = []
  if (c.totalGames >= 1) out.push('first-step')
  if (c.streak >= 7) out.push('streak-7')
  if (c.streak >= 30) out.push('streak-30')
  if (c.rawScore >= 1000) out.push('mind-awake')
  if (c.distinctGames >= 10) out.push('all-rounder')
  if (c.gameId === 'stroop' && c.fastestCorrectMs !== undefined && c.fastestCorrectMs < 3000) out.push('speedster')
  if (c.totalGames >= 100) out.push('hard-worker')
  if (c.leader) out.push('leader')
  return out
}
