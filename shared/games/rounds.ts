// منطق چهار بازی مبتنی بر بانک داده: دسته‌بندی سریع، متضاد/مترادف، ضرب‌المثل ناقص، کلمهٔ مزاحم
// همهٔ توابع خالص‌اند و بانک را به‌عنوان ورودی می‌گیرند (قابل تست بدون دیتابیس)

export type Rng = () => number
export type Difficulty = 1 | 2 | 3

export const shuffle = <T>(arr: readonly T[], rng: Rng = Math.random): T[] => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

/** بونوس سرعت: ثانیه‌های باقی‌مانده (گرد به پایین) تقسیم بر divisor */
export const speedBonus = (secondsLeft: number, divisor = 1) => Math.floor(Math.max(0, secondsLeft) / divisor)

// ───────────── دسته‌بندی سریع ─────────────
export const CATEGORY_LABELS: Record<string, string> = {
  animal: 'حیوان',
  plant: 'گیاه',
  city: 'شهر',
  object: 'شیء',
  food: 'غذا'
}
export const QC = { words: 20, totalSeconds: 60, secondsPerWord: { 1: 5, 2: 4, 3: 3 } as Record<Difficulty, number> }

export interface CategoryRound {
  word: string
  category: string
  /** دسته‌های فعال این دور (۲ تا ۵) */
  options: string[]
}

/** تعداد دسته‌های فعال برای کلمهٔ i (از ۰): از ۲ شروع می‌شود و هر ۵ کلمه یکی بیشتر تا ۵ */
export const categoriesAt = (i: number) => Math.min(5, 2 + Math.floor(i / 5))

export function buildCategoryRounds(bank: Record<string, string[]>, n = QC.words, rng: Rng = Math.random): CategoryRound[] {
  const order = shuffle(Object.keys(bank), rng)
  const used = new Set<string>()
  const rounds: CategoryRound[] = []
  for (let i = 0; i < n; i++) {
    const options = order.slice(0, categoriesAt(i))
    const category = options[Math.floor(rng() * options.length)]!
    const pool = (bank[category] ?? []).filter((w) => !used.has(w))
    if (!pool.length) continue
    const word = pool[Math.floor(rng() * pool.length)]!
    used.add(word)
    rounds.push({ word, category, options })
  }
  return rounds
}

/** درست +۵، غلط −۳ */
export const categoryDelta = (ok: boolean, secondsLeft: number) => (ok ? 5 + speedBonus(secondsLeft) : -3)

// ───────────── متضاد / مترادف ─────────────
export const SA = { pairs: 20, secondsPerPair: 5 }

export interface PairRow {
  a: string
  b: string
  isAntonym: boolean
  level: number
}
export interface PairRound {
  a: string
  b: string
  isAntonym: boolean
}

/** سطح آشنایی = سختی؛ نیمی متضاد و نیمی مترادف */
export function buildPairRounds(rows: PairRow[], difficulty: Difficulty, n = SA.pairs, rng: Rng = Math.random): PairRound[] {
  const pool = rows.filter((r) => r.level === difficulty)
  const half = Math.floor(n / 2)
  const pick = (isAntonym: boolean, count: number) =>
    shuffle(
      pool.filter((r) => r.isAntonym === isAntonym),
      rng
    ).slice(0, count)
  const chosen = [...pick(true, half), ...pick(false, n - half)]
  return shuffle(chosen, rng).map((r) =>
    rng() < 0.5 ? { a: r.a, b: r.b, isAntonym: r.isAntonym } : { a: r.b, b: r.a, isAntonym: r.isAntonym }
  )
}

/** درست +۵، غلط −۲ */
export const pairDelta = (ok: boolean, secondsLeft: number) => (ok ? 5 + speedBonus(secondsLeft) : -2)

// ───────────── ضرب‌المثل ناقص ─────────────
export const PV = { questions: 15, secondsPerQuestion: 10 }

export interface ProverbRow {
  text: string
  answer: string
  level: number
}
export interface ProverbRound {
  text: string
  answer: string
  options: string[]
}

/** مزاحم‌ها از پاسخ ضرب‌المثل‌های دیگر انتخاب می‌شوند (نه خود پاسخ و نه کلمه‌ای که در متن هست) */
export function buildProverbRounds(rows: ProverbRow[], difficulty: Difficulty, n = PV.questions, rng: Rng = Math.random): ProverbRound[] {
  const pool = rows.filter((r) => r.level === difficulty)
  const chosen = shuffle(
    pool.length >= n
      ? pool
      : [
          ...pool,
          ...shuffle(
            rows.filter((r) => r.level !== difficulty),
            rng
          )
        ],
    rng
  ).slice(0, n)
  const answers = [...new Set(rows.map((r) => r.answer))]
  return chosen.map((r) => {
    const ds = shuffle(
      answers.filter((a) => a !== r.answer && !r.text.includes(a)),
      rng
    ).slice(0, 3)
    return { text: r.text, answer: r.answer, options: shuffle([r.answer, ...ds], rng) }
  })
}

/** درست +۱۰ به‌علاوهٔ بونوس سرعت (نصف ثانیه‌های باقی‌مانده)، غلط ۰ */
export const proverbDelta = (ok: boolean, secondsLeft: number) => (ok ? 10 + speedBonus(secondsLeft, 2) : 0)

// ───────────── کلمهٔ مزاحم ─────────────
export const OD = { rounds: 20, secondsPerRound: 8 }

export interface OddGroupRow {
  name: string
  family: string
  members: string[]
}
export interface OddRound {
  words: string[]
  oddIndex: number
}

/**
 * ۴ کلمه از یک گروه + ۱ کلمه از گروه دیگر.
 * آسان: خانوادهٔ متفاوت · سخت: همان خانواده (مثلاً ابزار آشپزی در برابر ابزار تمیزکاری) · متوسط: ترکیب
 */
export function buildOddRounds(groups: OddGroupRow[], difficulty: Difficulty, n = OD.rounds, rng: Rng = Math.random): OddRound[] {
  const rounds: OddRound[] = []
  const gs = groups.filter((g) => g.members.length >= 4)
  for (let i = 0; i < n; i++) {
    const g = gs[Math.floor(rng() * gs.length)]!
    const sameFamily = difficulty === 3 || (difficulty === 2 && rng() < 0.5)
    const others = gs.filter((h) => h.name !== g.name && (sameFamily ? h.family === g.family : h.family !== g.family))
    const candidates = others.length ? others : gs.filter((x) => x.name !== g.name)
    const h = candidates[Math.floor(rng() * candidates.length)]!
    const four = shuffle(g.members, rng).slice(0, 4)
    const odd = h.members[Math.floor(rng() * h.members.length)]!
    const words = shuffle([...four, odd], rng)
    rounds.push({ words, oddIndex: words.indexOf(odd) })
  }
  return rounds
}

/** پیدا کردن درست +۱۰ به‌علاوهٔ نصف ثانیه‌های باقی‌مانده */
export const oddDelta = (ok: boolean, secondsLeft: number) => (ok ? 10 + speedBonus(secondsLeft, 2) : 0)
