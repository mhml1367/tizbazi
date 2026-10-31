import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../server/generated/prisma/client'

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
}

main().finally(() => prisma.$disconnect())
