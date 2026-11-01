// ساخت بانک «اسم‌فامیل» (prisma/data/esm-famil.json) از:
//  - esm-famil-hand.json و esm-famil-extra.json (دستی)
//  - persian-names (اسم‌ها، MIT/Apache-2.0) · iran-cities-json (شهرهای ایران، MIT) · i18n-iso-countries (نام فارسی کشورها، MIT)
// کد بسته‌ها اجرا نمی‌شود؛ فقط دادهٔ متنی‌شان خوانده می‌شود.
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

const require = createRequire(import.meta.url)
const pkgDir = (name) => dirname(require.resolve(`${name}/package.json`))
const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'))
const data = (f) => join(import.meta.dirname, '..', 'prisma', 'data', f)

const hand = readJson(data('esm-famil-hand.json'))
const extra = readJson(data('esm-famil-extra.json'))
const clean = (s) => s.replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/\s+/g, ' ').trim()

// اسم‌ها: رشتهٔ «اسم⇥لاتین⇥کد|…» داخل dist/index.cjs
const src = readFileSync(join(pkgDir('persian-names'), 'dist', 'index.cjs'), 'utf8')
const names = [...src.matchAll(/(?:^|[|"])([آ-ی‌ ]{2,20})\t[A-Za-z' -]+\t/gm)].map((m) => clean(m[1]))

const cities = readJson(join(pkgDir('iran-cities-json'), 'shahr.json')).map((c) => clean(c.name))
const ostans = readJson(join(pkgDir('iran-cities-json'), 'ostan.json')).map((c) => clean(c.name))
const countries = Object.values(readJson(join(pkgDir('i18n-iso-countries'), 'langs', 'fa.json')).countries)
  .flat()
  .map(clean)

const merge = (...lists) => [...new Set(lists.flat().filter(Boolean).map(clean))].sort((a, b) => a.localeCompare(b, 'fa'))
const out = {
  name: merge(hand.name, names),
  family: merge(hand.family, extra.family),
  city: merge(
    hand.city,
    extra.city,
    cities,
    ostans.filter((o) => !/\s/.test(o))
  ),
  country: merge(hand.country, countries),
  animal: merge(hand.animal, extra.animal),
  food: merge(hand.food, extra.food),
  fruit: merge(hand.fruit, extra.fruit),
  color: merge(hand.color, extra.color),
  object: merge(hand.object, extra.object)
}
writeFileSync(data('esm-famil.json'), JSON.stringify(out) + '\n')
for (const [k, v] of Object.entries(out)) console.log(k.padEnd(8), v.length)
