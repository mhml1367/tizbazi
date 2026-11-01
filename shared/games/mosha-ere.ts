// منطق «مشاعره»: بیت بعدی باید با حرف آخرِ بیت قبل شروع شود
import { firstLetter, lastLetter } from '../persian'

export type Rng = () => number
export type Difficulty = 1 | 2 | 3

export interface Verse {
  m1: string
  m2: string
  poet: string
}
export interface MoshaereRound {
  /** بیت قبلی زنجیره */
  current: Verse
  /** حرفی که بیت بعدی با آن شروع می‌شود (حرف آخر بیت قبلی) */
  letter: string
  /** بیت بعدی؛ مصراع اولش نشان داده می‌شود و بازیکن مصراع دوم را پیدا می‌کند */
  next: Verse
  /** گزینه‌ها: مصراع دوم */
  options: string[]
  answerIndex: number
}

export const MS = { rounds: 10, seconds: { 1: 25, 2: 18, 3: 12 } as Record<Difficulty, number> }

export const verseFirst = (v: Verse) => firstLetter(v.m1)
export const verseLast = (v: Verse) => lastLetter(v.m2)

const shuffle = <T>(a: readonly T[], rng: Rng): T[] => {
  const r = [...a]
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[r[i], r[j]] = [r[j]!, r[i]!]
  }
  return r
}

/**
 * زنجیرهٔ مشاعره. هر دور: بیت قبلی ← بیت بعدی که با حرف آخر آن شروع می‌شود؛ مصراع اولِ بیت بعدی نشان داده
 * می‌شود و بازیکن مصراع دومش را از میان ۴ گزینه پیدا می‌کند (شناختن شعر، وزن و قافیه — نه فقط تطبیق حرف).
 * متوسط: گزینه‌های غلط ترجیحاً از همان شاعر · سخت: ترجیحاً هم‌قافیه (همان حرف آخر) و از همان شاعر.
 */
export function buildMoshaereRounds(verses: Verse[], difficulty: Difficulty, n = MS.rounds, rng: Rng = Math.random): MoshaereRound[] {
  const byFirst = new Map<string, number[]>()
  verses.forEach((v, i) => byFirst.set(verseFirst(v), [...(byFirst.get(verseFirst(v)) ?? []), i]))
  const hasNext = (i: number, used: Set<number>) => (byFirst.get(verseLast(verses[i]!)) ?? []).some((j) => !used.has(j) && j !== i)

  const used = new Set<number>()
  const startPool = verses.map((_, i) => i).filter((i) => hasNext(i, used))
  let cur = startPool[Math.floor(rng() * startPool.length)]!
  used.add(cur)

  const rounds: MoshaereRound[] = []
  for (let r = 0; r < n; r++) {
    // اگر زنجیره به بن‌بست خورد، از بیتی تازه ادامه می‌دهیم
    if (!hasNext(cur, used)) {
      const fresh = verses.map((_, i) => i).filter((i) => !used.has(i) && hasNext(i, used))
      if (!fresh.length) break
      cur = fresh[Math.floor(rng() * fresh.length)]!
      used.add(cur)
    }
    const letter = verseLast(verses[cur]!)
    const cands = (byFirst.get(letter) ?? []).filter((j) => !used.has(j))
    const ans = cands[Math.floor(rng() * cands.length)]!
    const target = verses[ans]!
    const others = shuffle(
      verses.map((_, i) => i).filter((i) => i !== ans && verses[i]!.m2 !== target.m2),
      rng
    )
    // ترتیب ترجیح گزینه‌های غلط بر اساس سختی؛ بقیه برای پر کردن ۴ گزینه
    const samePoet = (i: number) => verses[i]!.poet === target.poet
    const sameRhyme = (i: number) => verseLast(verses[i]!) === verseLast(target)
    const rank = (i: number) => (difficulty === 1 ? 0 : (samePoet(i) ? -1 : 0) + (difficulty === 3 && sameRhyme(i) ? -2 : 0))
    const distractors = [...others].sort((a, b) => rank(a) - rank(b)).slice(0, 3)
    const options = shuffle([ans, ...distractors], rng)
    rounds.push({
      current: verses[cur]!,
      letter,
      next: target,
      options: options.map((i) => verses[i]!.m2),
      answerIndex: options.indexOf(ans)
    })
    used.add(ans)
    cur = ans
  }
  return rounds
}

/** درست: ۱۰ + نصف ثانیه‌های باقی‌مانده */
export const moshaereDelta = (ok: boolean, secondsLeft: number) => (ok ? 10 + Math.floor(Math.max(0, secondsLeft) / 2) : 0)
