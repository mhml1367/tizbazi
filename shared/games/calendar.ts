// منطق «تقویم ذهنی»: محاسبهٔ روز هفته و تاریخ شمسی در ذهن
export type Rng = () => number
export type Difficulty = 1 | 2 | 3

export const CAL = { questions: 10, seconds: { 1: 25, 2: 25, 3: 30 } as Record<Difficulty, number> }

export const WEEKDAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه']
export const MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']
/** سال غیرکبیسه: ۶ ماه ۳۱ روزه، ۵ ماه ۳۰ روزه، اسفند ۲۹ روز */
export const MONTH_DAYS = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29]

export interface JDate {
  m: number // ۱ تا ۱۲
  d: number
}
/** وضعیت امروز (از کلاینت): ماه و روز شمسی و روز هفته با شنبه = ۰ */
export interface Today extends JDate {
  weekday: number
}

export const dayOfYear = ({ m, d }: JDate) => MONTH_DAYS.slice(0, m - 1).reduce((a, b) => a + b, 0) + d
export function fromDayOfYear(n: number): JDate {
  let m = 1
  while (n > MONTH_DAYS[m - 1]!) n -= MONTH_DAYS[m++ - 1]!
  return { m, d: n }
}
export const fmtDate = ({ m, d }: JDate) => `${d.toLocaleString('fa-IR')} ${MONTHS[m - 1]}`
const fa = (n: number) => n.toLocaleString('fa-IR')

export interface CalendarQuestion {
  text: string
  options: string[]
  answer: string
}

const int = (a: number, b: number, rng: Rng) => a + Math.floor(rng() * (b - a + 1))
const shuffle = <T>(a: readonly T[], rng: Rng): T[] => {
  const r = [...a]
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[r[i], r[j]] = [r[j]!, r[i]!]
  }
  return r
}
const uniq4 = (answer: string, extra: string[], rng: Rng) =>
  shuffle([answer, ...[...new Set(extra.filter((e) => e !== answer))].slice(0, 3)], rng)

/** روز هفته N روز بعد */
function weekdayAfter(difficulty: Difficulty, rng: Rng): CalendarQuestion {
  const start = int(0, 6, rng)
  const n = difficulty === 1 ? int(2, 20, rng) : difficulty === 2 ? int(15, 60, rng) : int(40, 200, rng)
  const ans = WEEKDAYS[(start + n) % 7]!
  return {
    text: `اگر امروز ${WEEKDAYS[start]} باشد، ${fa(n)} روز بعد چه روزی است؟`,
    answer: ans,
    options: uniq4(ans, shuffle(WEEKDAYS, rng), rng)
  }
}

/** تاریخ N روز بعد از یک تاریخ (در همان سال غیرکبیسه) */
function dateAfter(difficulty: Difficulty, rng: Rng): CalendarQuestion {
  const n = difficulty === 1 ? int(3, 15, rng) : difficulty === 2 ? int(10, 45, rng) : int(30, 120, rng)
  const startDoy = int(1, 365 - n, rng)
  const start = fromDayOfYear(startDoy)
  const ans = fromDayOfYear(startDoy + n)
  const wrong = [startDoy + n - 1, startDoy + n + 1, startDoy + n - 2, startDoy + n + 30]
    .filter((x) => x >= 1 && x <= 365)
    .map((x) => fmtDate(fromDayOfYear(x)))
  return {
    text: `${fa(n)} روز بعد از ${fmtDate(start)} چه تاریخی است؟ (سال کبیسه نیست)`,
    answer: fmtDate(ans),
    options: uniq4(fmtDate(ans), wrong, rng)
  }
}

/** فاصلهٔ دو تاریخ */
function daysBetween(rng: Rng): CalendarQuestion {
  const a = int(1, 250, rng)
  const b = a + int(20, 110, rng)
  const ans = b - a
  return {
    text: `از ${fmtDate(fromDayOfYear(a))} تا ${fmtDate(fromDayOfYear(b))} چند روز فاصله است؟`,
    answer: fa(ans),
    options: uniq4(fa(ans), [fa(ans - 1), fa(ans + 1), fa(ans + 2), fa(ans - 2)], rng)
  }
}

/** روز هفتهٔ یک تاریخ امسال (با دانستن امروز) — تاریخ‌های اسفند کنار گذاشته می‌شوند چون به کبیسه بستگی دارند */
function weekdayOfDate(today: Today, rng: Rng): CalendarQuestion {
  const t = dayOfYear(today)
  let target: number
  do target = int(Math.max(1, t - 60), Math.min(336, t + 60), rng)
  while (target === t)
  const wd = (((today.weekday + (target - t)) % 7) + 7) % 7
  const ans = WEEKDAYS[wd]!
  return {
    text: `امروز ${fmtDate(today)} و ${WEEKDAYS[today.weekday]} است. ${fmtDate(fromDayOfYear(target))} امسال چه روزی است؟`,
    answer: ans,
    options: uniq4(ans, shuffle(WEEKDAYS, rng), rng)
  }
}

export function generateQuestion(difficulty: Difficulty, today: Today, rng: Rng = Math.random): CalendarQuestion {
  const kinds: ((r: Rng) => CalendarQuestion)[] =
    difficulty === 1
      ? [(r) => weekdayAfter(1, r), (r) => dateAfter(1, r)]
      : difficulty === 2
        ? [(r) => weekdayAfter(2, r), (r) => dateAfter(2, r), (r) => weekdayOfDate(today, r)]
        : [(r) => weekdayAfter(3, r), (r) => dateAfter(3, r), (r) => daysBetween(r), (r) => weekdayOfDate(today, r)]
  return kinds[Math.floor(rng() * kinds.length)]!(rng)
}

/** درست: ۱۰ + نصف ثانیه‌های باقی‌مانده */
export const calendarDelta = (ok: boolean, secondsLeft: number) => (ok ? 10 + Math.floor(Math.max(0, secondsLeft) / 2) : 0)
