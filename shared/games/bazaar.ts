// منطق «بازار»: حساب ذهنی خرید با تومان و ریال (قیمت‌ها فرضی‌اند)
export type Rng = () => number
export type Difficulty = 1 | 2 | 3

export const BZ = { questions: 12, seconds: { 1: 25, 2: 25, 3: 30 } as Record<Difficulty, number> }

/** کالا: نام، واحد، بازهٔ قیمت (هزار تومان) */
export const ITEMS: { name: string; unit: string; min: number; max: number; half?: boolean }[] = [
  { name: 'نان سنگک', unit: 'عدد', min: 10, max: 25 },
  { name: 'شیر', unit: 'پاکت', min: 20, max: 45 },
  { name: 'پنیر', unit: 'بسته', min: 60, max: 150 },
  { name: 'سیب', unit: 'کیلو', min: 40, max: 90, half: true },
  { name: 'پرتقال', unit: 'کیلو', min: 35, max: 80, half: true },
  { name: 'گوجه‌فرنگی', unit: 'کیلو', min: 20, max: 50, half: true },
  { name: 'برنج', unit: 'کیلو', min: 90, max: 160, half: true },
  { name: 'روغن', unit: 'بطری', min: 80, max: 180 },
  { name: 'چای', unit: 'بسته', min: 150, max: 350 },
  { name: 'خرما', unit: 'بسته', min: 70, max: 200 },
  { name: 'تخم‌مرغ', unit: 'شانه', min: 150, max: 300 },
  { name: 'گوشت', unit: 'کیلو', min: 500, max: 900, half: true },
  { name: 'مرغ', unit: 'کیلو', min: 120, max: 200, half: true },
  { name: 'ماست', unit: 'سطل', min: 40, max: 90 },
  { name: 'سبزی خوردن', unit: 'بسته', min: 15, max: 40 },
  { name: 'پسته', unit: 'کیلو', min: 600, max: 1200, half: true }
]

export interface BazaarQuestion {
  text: string
  answer: number
  options: number[]
  /** واحد پاسخ */
  unit: 'تومان' | 'ریال'
}

const int = (a: number, b: number, rng: Rng) => a + Math.floor(rng() * (b - a + 1))
const pick = <T>(arr: readonly T[], rng: Rng) => arr[Math.floor(rng() * arr.length)]!
const shuffle = <T>(a: readonly T[], rng: Rng): T[] => {
  const r = [...a]
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[r[i], r[j]] = [r[j]!, r[i]!]
  }
  return r
}

/** قیمت گرد به ۵ هزار تومان */
const price = (it: (typeof ITEMS)[number], rng: Rng) => Math.round(int(it.min, it.max, rng) / 5) * 5 * 1000
export const fmt = (n: number) => n.toLocaleString('fa-IR')
const qty = (q: number) => (q === 0.5 ? 'نیم' : q === 1.5 ? 'یک و نیم' : fmt(q))

/** سبد خرید با ۲ یا ۳ قلم */
function basket(n: number, allowHalf: boolean, rng: Rng) {
  const items = shuffle(ITEMS, rng).slice(0, n)
  return items.map((it) => {
    const q = allowHalf && it.half && rng() < 0.4 ? pick([0.5, 1.5], rng) : int(1, 3, rng)
    return { it, q, p: price(it, rng) }
  })
}
/** «عددی»، «کیلویی»، ولی «بسته‌ای»، «شانه‌ای»، «بطری‌ای» */
export const perUnit = (unit: string) => (/[هی]$/.test(unit) ? `${unit}‌ای` : /[او]$/.test(unit) ? `${unit}یی` : `${unit}ی`)
const describe = (b: ReturnType<typeof basket>) =>
  b.map(({ it, q, p }) => `${qty(q)} ${it.unit} ${it.name} (${perUnit(it.unit)} ${fmt(p)} تومان)`).join('، ')
const sum = (b: ReturnType<typeof basket>) => b.reduce((s, { q, p }) => s + q * p, 0)

/** گزینه‌های غلط از اشتباه‌های رایج: یک قلم جاافتاده، اختلاف ۵ یا ۱۰ هزار، و جابه‌جایی تومان/ریال */
function options(answer: number, extras: number[], rng: Rng): number[] {
  const set = new Set<number>([answer])
  for (const e of shuffle(extras, rng)) if (e > 0 && set.size < 4) set.add(e)
  const step = answer >= 1_000_000 ? 50_000 : 5_000
  let k = 1
  while (set.size < 4) {
    const v = answer + (rng() < 0.5 ? -1 : 1) * step * k++
    if (v > 0) set.add(v)
  }
  return shuffle([...set], rng)
}

/** آسان: جمع خرید · متوسط: باقی پول · سخت: تخفیف درصدی یا پاسخ به ریال، با مقدارهای نیم‌کیلویی */
export function generateQuestion(difficulty: Difficulty, rng: Rng = Math.random): BazaarQuestion {
  if (difficulty === 1) {
    const b = basket(2, false, rng)
    const total = sum(b)
    return {
      text: `${describe(b)}. جمع خرید چند تومان است؟`,
      answer: total,
      unit: 'تومان',
      options: options(total, [total - b[0]!.p, total + b[1]!.p, total + 10_000], rng)
    }
  }
  if (difficulty === 2) {
    const b = basket(rng() < 0.5 ? 2 : 3, false, rng)
    const total = sum(b)
    const paid = [200_000, 500_000, 1_000_000, 2_000_000].find((x) => x > total) ?? Math.ceil(total / 1_000_000) * 1_000_000 + 1_000_000
    const change = paid - total
    return {
      text: `${describe(b)}. با ${fmt(paid)} تومان پول، چقدر باقی می‌گیری؟`,
      answer: change,
      unit: 'تومان',
      options: options(change, [change + b[0]!.p, change - 10_000, paid - total + 5_000], rng)
    }
  }
  const b = basket(2, true, rng)
  const total = sum(b)
  if (rng() < 0.5) {
    const off = pick([10, 20, 25, 50], rng)
    const pay = Math.round((total * (100 - off)) / 100)
    return {
      text: `${describe(b)}. فروشنده ${fmt(off)}٪ تخفیف می‌دهد. چند تومان می‌پردازی؟`,
      answer: pay,
      unit: 'تومان',
      options: options(pay, [Math.round((total * off) / 100), total - off * 1000, pay + 10_000], rng)
    }
  }
  const rial = total * 10
  return {
    text: `${describe(b)}. جمع خرید چند ریال است؟`,
    answer: rial,
    unit: 'ریال',
    options: options(rial, [total, rial * 10, rial + 50_000], rng)
  }
}

/** درست: ۱۰ + نصف ثانیه‌های باقی‌مانده */
export const bazaarDelta = (ok: boolean, secondsLeft: number) => (ok ? 10 + Math.floor(Math.max(0, secondsLeft) / 2) : 0)
