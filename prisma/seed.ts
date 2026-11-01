import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../server/generated/prisma/client'
import { compareKey } from '../shared/persian'
import { isFiveLetters } from '../shared/games/wordle'

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })

const load = <T>(file: string): T => JSON.parse(readFileSync(new URL(`./data/${file}`, import.meta.url), 'utf8'))

async function main() {
  // «حرف گمشده» — ساخته‌شده با scripts/build-words.mjs
  const words = load<string[]>('words.json')
  const w = await prisma.word.createMany({ data: words.map((text) => ({ text })), skipDuplicates: true })
  console.log(`کلمات: ${w.count}`)

  // «دسته‌بندی سریع»
  const cats = load<Record<string, string[]>>('categories.json')
  const c = await prisma.categoryWord.createMany({
    data: Object.entries(cats).flatMap(([category, list]) => list.map((text) => ({ text, category }))),
    skipDuplicates: true
  })
  console.log(`کلمات دسته‌بندی: ${c.count}`)

  // «متضاد/مترادف»
  const pairs = load<[string, string, 'a' | 's', number][]>('pairs.json')
  const p = await prisma.wordPair.createMany({
    data: pairs.map(([a, b, t, level]) => ({ a, b, isAntonym: t === 'a', level })),
    skipDuplicates: true
  })
  console.log(`جفت‌ها: ${p.count}`)

  // «ضرب‌المثل ناقص»
  const proverbs = load<[string, string, number][]>('proverbs.json')
  const pr = await prisma.proverb.createMany({
    data: proverbs.map(([text, answer, level]) => ({ text, answer, level })),
    skipDuplicates: true
  })
  console.log(`ضرب‌المثل‌ها: ${pr.count}`)

  // «کلمهٔ مزاحم»
  const groups = load<{ name: string; family: string; members: string[] }[]>('odd-groups.json')
  const g = await prisma.oddGroup.createMany({ data: groups, skipDuplicates: true })
  console.log(`گروه‌های کلمه: ${g.count}`)

  // ───── بانک‌های بازی‌های ایرانی (جدول ContentItem؛ هر بار به‌روز می‌شوند) ─────
  const dictionary = load<string[]>('dictionary.json')
  const dict = new Set(dictionary)
  // جواب‌های «کلمه‌روز»: فقط ۵ حرفیِ بدون نیم‌فاصله که در واژه‌نامه هستند
  const answers = [...new Set(load<string[]>('wordle-answers.json').map(compareKey))].filter((w) => isFiveLetters(w) && dict.has(w))
  // «اسم‌فامیل»: کلیدهای مقایسه (بدون نیم‌فاصله و اعراب)
  const esm = Object.fromEntries(
    Object.entries(load<Record<string, string[]>>('esm-famil.json')).map(([k, v]) => [k, [...new Set(v.map(compareKey))]])
  )

  // «زنجیرهٔ کلمات»: فقط اسم‌های عام و شناخته‌شده (نه بانک بسامدی زیرنویس‌ها که فعل و کلمهٔ عامیانه دارد)
  const hand = load<Record<string, string[]>>('esm-famil-hand.json')
  const extra = load<Record<string, string[]>>('esm-famil-extra.json')
  const chainKinds = ['animal', 'food', 'fruit', 'color', 'object', 'country']
  const chainWords = [
    ...new Set(
      [...chainKinds.flatMap((k) => [...(hand[k] ?? []), ...(extra[k] ?? [])]), ...(extra.city ?? []), ...Object.values(cats).flat()]
        .map((s) => s.trim())
        .filter((s) => !/\s/.test(s) && Array.from(compareKey(s)).length >= 3)
    )
  ]

  const content: Record<string, unknown> = {
    dictionary,
    'chain-words': chainWords,
    'wordle-answers': answers,
    'esm-famil': esm,
    verses: load<[string, string, string][]>('verses.json').map(([m1, m2, poet]) => ({ m1, m2, poet })),
    riddles: load<[string, string, number][]>('riddles.json').map(([q, answer, level]) => ({ q, answer, level })),
    'iran-map': load('iran-map.json'),
    'chess-puzzles': load('chess-puzzles.json')
  }
  for (const [kind, data] of Object.entries(content)) {
    await prisma.contentItem.upsert({
      where: { kind_key: { kind, key: 'all' } },
      create: { kind, key: 'all', data: data as object },
      update: { data: data as object }
    })
    console.log(`محتوا «${kind}»: ${Array.isArray(data) ? data.length : Object.keys(data as object).length}`)
  }
}

main().finally(() => prisma.$disconnect())
