import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  OD,
  PV,
  QC,
  SA,
  buildCategoryRounds,
  buildOddRounds,
  buildPairRounds,
  buildProverbRounds,
  categoriesAt,
  categoryDelta,
  oddDelta,
  pairDelta,
  proverbDelta,
  type OddGroupRow,
  type PairRow,
  type ProverbRow
} from '../../shared/games/rounds'

const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296
  return seed / 4294967296
}
const data = <T>(f: string): T => JSON.parse(readFileSync(new URL(`../../prisma/data/${f}`, import.meta.url), 'utf8'))

const cats = data<Record<string, string[]>>('categories.json')
const pairs = data<[string, string, string, number][]>('pairs.json').map(([a, b, t, level]) => ({
  a,
  b,
  isAntonym: t === 'a',
  level
})) as PairRow[]
const proverbs = data<[string, string, number][]>('proverbs.json').map(([text, answer, level]) => ({ text, answer, level })) as ProverbRow[]
const groups = data<OddGroupRow[]>('odd-groups.json')

describe('بانک‌های داده (حداقل‌های مشخصات)', () => {
  it('اندازهٔ بانک‌ها', () => {
    expect(Object.keys(cats).length).toBe(5)
    expect(Object.values(cats).flat().length).toBeGreaterThanOrEqual(300)
    expect(pairs.length).toBeGreaterThanOrEqual(200)
    expect(proverbs.length).toBeGreaterThanOrEqual(100)
    expect(groups.length).toBeGreaterThanOrEqual(50)
  })
  it('هر ضرب‌المثل دقیقاً یک جای خالی دارد و هر سطح داده دارد', () => {
    for (const p of proverbs) expect(p.text.split('___').length).toBe(2)
    for (const l of [1, 2, 3]) {
      expect(pairs.filter((p) => p.level === l && p.isAntonym).length).toBeGreaterThanOrEqual(10)
      expect(pairs.filter((p) => p.level === l && !p.isAntonym).length).toBeGreaterThanOrEqual(10)
      expect(proverbs.filter((p) => p.level === l).length).toBeGreaterThan(0)
    }
  })
})

describe('دسته‌بندی سریع', () => {
  it('تعداد دسته‌ها از ۲ تا ۵ بالا می‌رود', () => {
    expect([0, 4, 5, 10, 15, 19].map(categoriesAt)).toEqual([2, 2, 3, 4, 5, 5])
  })
  it('کلمه واقعاً متعلق به دستهٔ پاسخ است و دسته در گزینه‌هاست، بدون تکرار', () => {
    const rounds = buildCategoryRounds(cats, QC.words, seeded(4))
    expect(rounds.length).toBe(QC.words)
    expect(new Set(rounds.map((r) => r.word)).size).toBe(rounds.length)
    for (const r of rounds) {
      expect(cats[r.category]).toContain(r.word)
      expect(r.options).toContain(r.category)
    }
  })
  it('امتیاز: درست ۵ + بونوس، غلط −۳', () => {
    expect(categoryDelta(true, 3.9)).toBe(8)
    expect(categoryDelta(false, 3)).toBe(-3)
  })
})

describe('متضاد/مترادف', () => {
  it('۲۰ جفت، نیمی متضاد، همه از سطح مربوط', () => {
    for (const d of [1, 2, 3] as const) {
      const rs = buildPairRounds(pairs, d, SA.pairs, seeded(d))
      expect(rs.length).toBe(20)
      expect(rs.filter((r) => r.isAntonym).length).toBe(10)
      for (const r of rs) {
        const row = pairs.find((p) => (p.a === r.a && p.b === r.b) || (p.a === r.b && p.b === r.a))!
        expect(row.level).toBe(d)
        expect(row.isAntonym).toBe(r.isAntonym)
      }
    }
  })
  it('امتیاز: ۵ + بونوس، غلط −۲', () => {
    expect(pairDelta(true, 2)).toBe(7)
    expect(pairDelta(false, 2)).toBe(-2)
  })
})

describe('ضرب‌المثل ناقص', () => {
  it('۱۵ سؤال، ۴ گزینهٔ یکتا شامل پاسخ؛ مزاحم در متن نیست', () => {
    for (const d of [1, 2, 3] as const) {
      const rs = buildProverbRounds(proverbs, d, PV.questions, seeded(d + 10))
      expect(rs.length).toBe(15)
      for (const r of rs) {
        expect(r.options.length).toBe(4)
        expect(new Set(r.options).size).toBe(4)
        expect(r.options).toContain(r.answer)
        for (const o of r.options) if (o !== r.answer) expect(r.text.includes(o)).toBe(false)
      }
    }
  })
  it('امتیاز: ۱۰ + نصف ثانیهٔ باقی‌مانده، غلط ۰', () => {
    expect(proverbDelta(true, 7)).toBe(13)
    expect(proverbDelta(false, 7)).toBe(0)
  })
})

describe('کلمهٔ مزاحم', () => {
  it('۴ کلمه هم‌گروه + ۱ مزاحم که در گروه اصلی نیست', () => {
    for (const d of [1, 2, 3] as const) {
      const rs = buildOddRounds(groups, d, OD.rounds, seeded(d + 20))
      expect(rs.length).toBe(20)
      for (const r of rs) {
        expect(r.words.length).toBe(5)
        const odd = r.words[r.oddIndex]!
        const rest = r.words.filter((_, i) => i !== r.oddIndex)
        const home = groups.filter((g) => rest.every((w) => g.members.includes(w)))
        expect(home.length).toBe(1)
        expect(home[0]!.members).not.toContain(odd)
      }
    }
  })
  it('آسان: خانوادهٔ متفاوت؛ سخت: همان خانواده', () => {
    const famOf = (w: string) => groups.find((g) => g.members.includes(w))!.family
    for (const [d, same] of [
      [1, false],
      [3, true]
    ] as const) {
      for (const r of buildOddRounds(groups, d, 40, seeded(99))) {
        const odd = r.words[r.oddIndex]!
        const rest = r.words.filter((_, i) => i !== r.oddIndex)
        expect(famOf(odd) === famOf(rest[0]!)).toBe(same)
      }
    }
  })
  it('امتیاز', () => {
    expect(oddDelta(true, 6)).toBe(13)
    expect(oddDelta(false, 6)).toBe(0)
  })
})
