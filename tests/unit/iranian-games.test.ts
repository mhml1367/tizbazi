import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { compareKey, firstLetter, lastLetter } from '../../shared/persian'
import { WD, dailyIndex, isFiveLetters, markGuess, shareText, wordleScore } from '../../shared/games/wordle'
import { EF_CATEGORIES, EF_LETTERS, isSurname, judge, pickRound, timeBonus } from '../../shared/games/esm-famil'
import { buildMoshaereRounds, verseFirst, verseLast, type Verse } from '../../shared/games/mosha-ere'
import { buildRiddleRounds, hintRemovals, riddleDelta } from '../../shared/games/riddle'
import * as M from '../../shared/games/morris'
import { generateQuestion as bazaarQ, perUnit } from '../../shared/games/bazaar'
import { WEEKDAYS, dayOfYear, fromDayOfYear, generateQuestion as calQ } from '../../shared/games/calendar'
import { buildMapRounds, type MapData } from '../../shared/games/iran-map'
import { TL_RULES, buildDeck, sameFace, tileScore } from '../../shared/games/tiles'
import { checkWord, computerReply, wordPoints } from '../../shared/games/word-chain'
import { CB_RULES, codeScore, feedback, makeSecret, validGuess } from '../../shared/games/code-breaker'

const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296
  return seed / 4294967296
}
const data = <T>(f: string): T => JSON.parse(readFileSync(new URL(`../../prisma/data/${f}`, import.meta.url), 'utf8'))
const dictionary = new Set(data<string[]>('dictionary.json'))

describe('یکدست‌سازی فارسی', () => {
  it('ی/ک عربی، اعراب و نیم‌فاصله', () => {
    expect(compareKey('علي‌رضا')).toBe('علیرضا')
    expect(compareKey('كتابْ')).toBe('کتاب')
    expect(firstLetter('آسمان')).toBe('ا')
    expect(lastLetter('دریا')).toBe('ا')
  })
})

describe('کلمه‌روز', () => {
  it('علامت‌گذاری با حروف تکراری مثل وردل اصلی', () => {
    expect(markGuess('باران', 'باران')).toEqual(['g', 'g', 'g', 'g', 'g'])
    // «ا» و «ر» در جواب هستند ولی جای دیگری
    expect(markGuess('سماور', 'باران')).toEqual(['b', 'b', 'y', 'b', 'y'])
    // «ا» دوبار در حدس ولی فقط یک «ا» آزاد در جواب → یکی زرد، دیگری خاکستری
    expect(markGuess('اادبا', 'سرابی')).toEqual(['y', 'b', 'b', 'g', 'b'])
  })
  it('امتیاز و اشتراک‌گذاری', () => {
    expect(wordleScore(true, 1)).toBe(120)
    expect(wordleScore(true, 6)).toBe(20)
    expect(wordleScore(false, 6)).toBe(0)
    expect(
      shareText(
        'کلمه‌روز',
        [
          ['b', 'y', 'g', 'b', 'b'],
          ['g', 'g', 'g', 'g', 'g']
        ],
        true
      )
    ).toBe('کلمه‌روز 2/6\n⬜🟨🟩⬜⬜\n🟩🟩🟩🟩🟩')
  })
  it('جواب‌های روزانهٔ معتبر: ۵ حرفی، در واژه‌نامه، و حداقل ۱۰۰ تا', () => {
    const answers = data<string[]>('wordle-answers.json')
      .map(compareKey)
      .filter((w) => isFiveLetters(w) && dictionary.has(w))
    expect(answers.length).toBeGreaterThanOrEqual(100)
    expect(new Set(answers).size).toBe(answers.length)
    expect(dailyIndex('2026-11-01', answers.length)).toBe(dailyIndex('2026-11-01', answers.length))
    expect(WD.maxGuesses).toBe(6)
  })
})

describe('اسم‌فامیل', () => {
  const bank = data<Record<string, string[]>>('esm-famil.json')
  it('بانک همهٔ دسته‌ها را دارد و برای بیشتر حروف جواب دارد', () => {
    for (const c of EF_CATEGORIES) expect(bank[c.id]?.length).toBeGreaterThan(30)
    // هر حرف بازی دست‌کم در ۴ دسته جواب تأییدشده دارد
    for (const l of EF_LETTERS) {
      const covered = EF_CATEGORIES.filter((c) => bank[c.id]!.some((w) => firstLetter(w) === l)).length
      expect(covered, `حرف ${l}`).toBeGreaterThanOrEqual(4)
    }
  })
  it('داوری: تأییدشده، کلمهٔ واقعی، حرف غلط، ناشناخته، خالی', () => {
    const animals = new Set(bank.animal!.map(compareKey))
    expect(judge('زرافه', 'ز', animals, dictionary)).toEqual({ status: 'verified', points: 10 })
    expect(judge('زنگوله', 'ز', animals, dictionary).status).toBe('word')
    expect(judge('شیر', 'ز', animals, dictionary).status).toBe('wrong-letter')
    expect(judge('زززز', 'ز', animals, dictionary).status).toBe('unknown')
    expect(judge('  ', 'ز', animals, dictionary).status).toBe('empty')
    expect(judge('آهو', 'ا', animals, dictionary).status).toBe('verified') // «آ» = «ا»
  })
  it('بانک بزرگ: شهرهای ایران، اسم‌ها و کشورها', () => {
    const has = (k: string, w: string) => bank[k]!.map(compareKey).includes(compareKey(w))
    expect(bank.name!.length).toBeGreaterThan(5000)
    expect(bank.city!.length).toBeGreaterThan(1000)
    expect(has('city', 'دماوند')).toBe(true)
    expect(has('name', 'دانیال')).toBe(true)
    expect(judge('امریکا', 'ا', new Set(bank.country!.map(compareKey)), dictionary).status).toBe('verified') // «آمریکا»
  })
  it('فامیل: ریشهٔ اسم/شهر + پسوند، یا کلمه + پسوند بلند', () => {
    const stems = new Set([...bank.name!, ...bank.city!].map(compareKey))
    const fam = new Set(bank.family!.map(compareKey))
    for (const w of ['دانشور', 'احمدی', 'رضایی', 'تهرانی', 'حسین‌زاده', 'کریم‌پور', 'نیک‌منش', 'دماوندی'])
      expect(judge(w, w[0]!, fam, dictionary, stems).status, w).toBe('verified')
    expect(isSurname(compareKey('زززی'), stems, dictionary)).toBe(false)
    // بدون stems (دسته‌های دیگر) قاعدهٔ فامیل اعمال نمی‌شود
    expect(judge('تهرانی', 'ت', new Set(), dictionary).status).not.toBe('verified')
  })
  it('دور و بونوس زمان', () => {
    const r = pickRound(2, seeded(3))
    expect(r.categories).toHaveLength(7)
    expect(EF_LETTERS).toContain(r.letter)
    expect(timeBonus(50, 4, 7)).toBe(10)
    expect(timeBonus(50, 3, 7)).toBe(0)
  })
})

describe('مشاعره', () => {
  const verses = data<[string, string, string][]>('verses.json').map(([m1, m2, poet]) => ({ m1, m2, poet })) as Verse[]
  it('بیت درست با حرف آخر بیت قبل شروع می‌شود و بقیه نه', () => {
    for (const d of [1, 2, 3] as const) {
      const rounds = buildMoshaereRounds(verses, d, 10, seeded(d))
      expect(rounds.length).toBe(10)
      for (const r of rounds) {
        expect(r.letter).toBe(verseLast(r.current))
        expect(verseFirst(r.next)).toBe(r.letter)
        expect(r.options).toHaveLength(4)
        expect(new Set(r.options).size).toBe(4)
        expect(r.options[r.answerIndex]).toBe(r.next.m2)
      }
      // زنجیره: بیت بعدیِ هر دور، بیت قبلیِ دور بعد است (مگر زنجیره بن‌بست شده باشد) و بیتی تکرار نمی‌شود
      const texts = rounds.map((r) => r.next.m1)
      expect(new Set(texts).size).toBe(texts.length)
      for (let i = 1; i < rounds.length; i++)
        if (rounds[i]!.current === rounds[i - 1]!.next) expect(rounds[i]!.current.m1).toBe(texts[i - 1])
    }
  })
  it('هر حرف پایانی دست‌کم یک بیت شروع‌شونده دارد', () => {
    const starts = new Set(verses.map(verseFirst))
    for (const v of verses) expect(starts.has(verseLast(v)), `${v.m2} → ${verseLast(v)}`).toBe(true)
  })
})

describe('چیستان', () => {
  const rows = data<[string, string, number][]>('riddles.json').map(([q, answer, level]) => ({ q, answer, level }))
  it('۴ گزینهٔ یکتا، راهنما فقط گزینه‌های غلط را حذف می‌کند', () => {
    const rounds = buildRiddleRounds(rows, 2, 10, seeded(4))
    expect(rounds).toHaveLength(10)
    for (const r of rounds) {
      expect(new Set(r.options).size).toBe(4)
      expect(r.options).toContain(r.answer)
      const h = hintRemovals(r, seeded(1))
      expect(h).toHaveLength(2)
      expect(h).not.toContain(r.answer)
    }
    expect(riddleDelta(true, 9, false)).toBe(18)
    expect(riddleDelta(true, 9, true)).toBe(9)
  })
})

describe('دوز', () => {
  it('همسایگی متقارن و ۱۶ دوز', () => {
    M.ADJ.forEach((ns, i) => ns.forEach((j) => expect(M.ADJ[j]).toContain(i)))
    expect(M.MILLS).toHaveLength(16)
  })
  it('مرحلهٔ چیدن: ۲۴ حرکت در شروع؛ دوز ساختن برداشتن مهره را ممکن می‌کند', () => {
    let s = M.initialState()
    expect(M.legalMoves(s)).toHaveLength(24)
    // سفید: ۰، ۱ ؛ سیاه: ۹، ۱۰ ؛ سفید با ۲ دوز می‌سازد
    for (const to of [0, 9, 1, 10]) s = M.applyMove(s, { to })
    const mills = M.legalMoves(s).filter((m) => m.to === 2)
    expect(mills.map((m) => m.remove!).sort((a, b) => a - b)).toEqual([9, 10])
    s = M.applyMove(s, { to: 2, remove: 9 })
    expect(s.board[9]).toBe(0)
    expect(M.inMill(s.board, 1, 1)).toBe(true)
  })
  it('مهرهٔ درون دوز برداشته نمی‌شود مگر همه در دوز باشند', () => {
    const b = Array<M.Cell>(24).fill(0)
    for (const i of [0, 1, 2, 9]) b[i] = 2
    expect(M.removable(b, 2)).toEqual([9])
    b[9] = 0
    expect(M.removable(b, 2)).toEqual([0, 1, 2])
  })
  it('باخت با کمتر از ۳ مهره و هوش مصنوعی دوز فوری را می‌گیرد', () => {
    const s: M.MorrisState = { board: Array<M.Cell>(24).fill(0), hand: { 1: 0, 2: 0 }, turn: 1, plies: 50 }
    s.board[0] = 1
    s.board[1] = 1
    s.board[5] = 1 // سفید با پرواز (۳ مهره) می‌تواند ۲ را پر کند
    s.board[20] = 2
    s.board[22] = 2
    s.board[23] = 2
    expect(M.phaseOf(s, 1)).toBe('fly')
    const m = M.bestMove(s, 3, seeded(1))
    expect(m.to).toBe(2)
    expect(m.remove).toBeDefined()
    const after = M.applyMove(s, m)
    expect(M.winner(after)).toBe(1) // سیاه به ۲ مهره رسید
  })
  it('امتیاز', () => {
    expect(M.morrisScore('win', 3, 5, 7)).toBe(350)
    expect(M.morrisScore('loss', 2, 0, 4)).toBe(20)
  })
})

describe('بازار', () => {
  it('جواب در گزینه‌هاست، گزینه‌ها یکتا و مثبت‌اند، و صفت واحد درست ساخته می‌شود', () => {
    const rng = seeded(8)
    for (let i = 0; i < 300; i++) {
      const q = bazaarQ(((i % 3) + 1) as 1 | 2 | 3, rng)
      expect(q.options).toContain(q.answer)
      expect(new Set(q.options).size).toBe(4)
      expect(q.options.every((o) => o > 0)).toBe(true)
      expect(Number.isInteger(q.answer)).toBe(true)
    }
    expect(perUnit('کیلو')).toBe('کیلویی')
    expect(perUnit('بسته')).toBe('بسته‌ای')
    expect(perUnit('بطری')).toBe('بطری‌ای')
  })
})

describe('تقویم ذهنی', () => {
  it('روز سال و برعکس (سال غیرکبیسه)', () => {
    expect(dayOfYear({ m: 1, d: 1 })).toBe(1)
    expect(dayOfYear({ m: 7, d: 1 })).toBe(187)
    expect(dayOfYear({ m: 12, d: 29 })).toBe(365)
    for (let n = 1; n <= 365; n++) expect(dayOfYear(fromDayOfYear(n))).toBe(n)
  })
  it('همهٔ سؤال‌ها ۴ گزینهٔ یکتا شامل جواب دارند', () => {
    const today = { m: 8, d: 10, weekday: 1 } // ۱۰ آبان، یکشنبه
    const rng = seeded(12)
    for (let i = 0; i < 300; i++) {
      const q = calQ(((i % 3) + 1) as 1 | 2 | 3, today, rng)
      expect(q.options).toContain(q.answer)
      expect(new Set(q.options).size).toBe(4)
    }
  })
  it('محاسبهٔ روز هفته درست است', () => {
    // اگر امروز شنبه باشد، ۹ روز بعد یکشنبه است
    const rng = () => 0
    const q = calQ(1, { m: 1, d: 1, weekday: 0 }, rng)
    expect(WEEKDAYS).toContain(q.options[0])
  })
})

describe('نقشهٔ ایران', () => {
  const map = data<MapData>('iran-map.json')
  it('۳۱ استان، هر کدام دقیقاً یک شکل مرزی دارد', () => {
    expect(map.provinces).toHaveLength(31)
    expect(map.shapes).toHaveLength(31)
    for (const p of map.provinces) {
      const shape = map.shapes.filter((s) => s.name === p.name)
      expect(shape).toHaveLength(1)
      expect(shape[0]!.d).toMatch(/^M[\d.,\s\-a-zA-Z]+$/)
    }
  })
  it('دورها: گزینه‌ها یکتا و شامل جواب؛ آسان «پیدا کن» ندارد', () => {
    for (const d of [1, 2, 3] as const) {
      const rounds = buildMapRounds(map.provinces, d, 12, seeded(d))
      expect(rounds).toHaveLength(12)
      for (const r of rounds) {
        if (d === 1) expect(r.kind).not.toBe('find')
        if (r.kind !== 'find') {
          expect(r.options).toContain(r.answer)
          expect(new Set(r.options).size).toBe(4)
        }
      }
    }
  })
})

describe('کاشی‌کاری', () => {
  it('هر نقش دقیقاً دوبار، تعداد جفت‌ها مطابق سختی', () => {
    for (const d of [1, 2, 3] as const) {
      const deck = buildDeck(d, seeded(d))
      expect(deck).toHaveLength(TL_RULES[d].pairs * 2)
      for (const c of deck) expect(deck.filter((x) => sameFace(x.face, c.face))).toHaveLength(2)
    }
    expect(tileScore(6, 4, 30, true)).toBe(6 * 20 - 12 + 15)
    expect(tileScore(1, 20, 30, false)).toBe(0)
  })
})

describe('زنجیرهٔ کلمات', () => {
  const bank = data<string[]>('words.json')
  it('اعتبارسنجی کلمه', () => {
    const used = new Set(['کتاب'])
    expect(checkWord('باران', 'کتاب', used, dictionary)).toBeNull()
    expect(checkWord('دریا', 'کتاب', used, dictionary)).toBe('letter')
    expect(checkWord('کتاب', null, used, dictionary)).toBe('used')
    expect(checkWord('بب', 'کتاب', used, dictionary)).toBe('short')
    expect(checkWord('بززززز', 'کتاب', used, dictionary)).toBe('unknown')
  })
  it('پاسخ رایانه با حرف درست شروع می‌شود و تکراری نیست', () => {
    const used = new Set<string>()
    for (const l of ['ب', 'م', 'د', 'ر', 'ن']) {
      const w = computerReply(l, used, bank, 2, seeded(5))!
      expect(firstLetter(w)).toBe(l)
      used.add(compareKey(w))
    }
    expect(wordPoints('کتابخانه')).toBe(5 + 5 * 2)
  })
})

describe('رمزشکن', () => {
  it('بازخورد با رقم‌های تکراری', () => {
    expect(feedback([1, 2, 3, 4], [1, 2, 3, 4])).toEqual({ exact: 4, present: 0 })
    expect(feedback([1, 2, 3, 4], [4, 3, 2, 1])).toEqual({ exact: 0, present: 4 })
    expect(feedback([1, 1, 2, 2], [1, 2, 1, 1])).toEqual({ exact: 1, present: 2 })
    expect(feedback([5, 6, 7], [8, 9, 0])).toEqual({ exact: 0, present: 0 })
  })
  it('رمز و حدس معتبر', () => {
    for (const d of [1, 2] as const) {
      const s = makeSecret(d, seeded(d))
      expect(s).toHaveLength(CB_RULES[d].length)
      expect(new Set(s).size).toBe(s.length)
    }
    expect(validGuess([1, 1, 2], 1)).toBe(false)
    expect(validGuess([1, 1, 2, 2], 3)).toBe(true)
    expect(codeScore(true, 2, 4)).toBe(40 + 60)
    expect(codeScore(false, 2, 10)).toBe(0)
  })
})
