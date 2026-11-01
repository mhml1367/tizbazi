// ساخت واژه‌نامهٔ تأیید کلمه (برای «اسم‌فامیل»، «زنجیرهٔ کلمات» و حدس‌های مجاز «کلمه‌روز»)
// از an-array-of-persian-words (MIT): فقط کلمات تمام‌حرف فارسی ۲ تا ۱۲ حرفی، یکدست‌شده
// استفاده: node scripts/build-dictionary.mjs <words.json> [خروجی]
import { readFileSync, writeFileSync } from 'node:fs'

const [src, out = 'prisma/data/dictionary.json'] = process.argv.slice(2)
if (!src) throw new Error('مسیر words.json را بدهید')

const norm = (s) =>
  s
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[ً-ْ‌]/g, '')
    .trim()
const PURE = /^[آابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی]+$/

const set = new Set()
for (const w of JSON.parse(readFileSync(src, 'utf8')).map(norm)) {
  const n = Array.from(w).length
  if (PURE.test(w) && n >= 2 && n <= 12) set.add(w)
}
const words = [...set].sort()
writeFileSync(out, JSON.stringify(words))
console.log(`واژه‌نامه: ${words.length} کلمه`)
