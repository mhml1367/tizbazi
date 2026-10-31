// بازه‌های زمانی لیدربورد به وقت تهران؛ هفته از شنبه و ماه/سال بر پایهٔ تقویم شمسی
// (نه date_trunc پیش‌فرض PostgreSQL که هفته را از دوشنبه و ماه را میلادی می‌گیرد)

export const PERIODS = ['today', 'week', 'month', 'year', 'all'] as const
export type Period = (typeof PERIODS)[number]

const TZ = 'Asia/Tehran'
const DAY_MS = 86_400_000
// ایران از ۱۴۰۱ ساعت تابستانی ندارد؛ آفست ثابت ۳:۳۰+
const TEHRAN_OFFSET_MS = 3.5 * 3_600_000

const gregFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' })
const weekdayFmt = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short' })
const jalaliFmt = new Intl.DateTimeFormat('en-u-ca-persian', { timeZone: TZ, year: 'numeric', month: 'numeric', day: 'numeric' })

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** لحظهٔ ساعت ۰۰:۰۰ تهرانِ همان روز */
export function tehranMidnight(now: Date = new Date()): Date {
  const [y, m, d] = gregFmt.format(now).split('-').map(Number)
  return new Date(Date.UTC(y!, m! - 1, d!) - TEHRAN_OFFSET_MS)
}

/** ماه و روز شمسی (به وقت تهران) */
export function jalaliParts(now: Date = new Date()) {
  const parts = jalaliFmt.formatToParts(now)
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value)
  return { month: get('month'), day: get('day') }
}

/** شروع بازه؛ برای «کل زمان» null */
export function periodStart(period: Period, now: Date = new Date()): Date | null {
  if (period === 'all') return null
  const midnight = tehranMidnight(now)
  if (period === 'today') return midnight

  if (period === 'week') {
    // شنبه = ۰، یکشنبه = ۱، … جمعه = ۶
    const sinceSaturday = (WEEKDAYS.indexOf(weekdayFmt.format(now)) + 1) % 7
    return new Date(midnight.getTime() - sinceSaturday * DAY_MS)
  }

  const { month, day } = jalaliParts(now)
  if (period === 'month') return new Date(midnight.getTime() - (day - 1) * DAY_MS)

  // سال: ۶ ماه اول ۳۱ روز، ۵ ماه بعد ۳۰ روز
  const dayOfYear = month <= 6 ? (month - 1) * 31 + day : 186 + (month - 7) * 30 + day
  return new Date(midnight.getTime() - (dayOfYear - 1) * DAY_MS)
}

export const isPeriod = (v: unknown): v is Period => typeof v === 'string' && (PERIODS as readonly string[]).includes(v)
