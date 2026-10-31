// ساخت بانک کلمات بازی «حرف گمشده»:
//   تقاطع واژه‌نامهٔ ~۲۴۰هزارکلمه‌ای (an-array-of-persian-words، MIT)
//   با فهرست بسامدی (hermitdave/FrequencyWords، fa_50k) تا فقط کلمات واقعی و رایج بمانند.
// استفاده: node scripts/build-words.mjs <words.json> <fa_50k.txt> [خروجی]
import { readFileSync, writeFileSync } from 'node:fs'

const [dictPath, freqPath, outPath = 'prisma/data/words.json'] = process.argv.slice(2)
if (!dictPath || !freqPath) throw new Error('مسیر words.json و fa_50k.txt را بدهید')

// یکدست‌سازی املای عربی/فارسی
const norm = (s) =>
  s
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[ً-ْ‌]/g, '')
    .trim()
const PURE = /^[آابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی]+$/

const MI_OK = new Set([
  'میدان',
  'میوه',
  'میهمان',
  'میراث',
  'میلیون',
  'میانه',
  'میزان',
  'میکروب',
  'میهن',
  'میانگین',
  'میلیارد',
  'میثاق',
  'میانجی',
  'میکرو'
])
const COLLOQUIAL = new Set([
  'باشه',
  'خالیه',
  'اتفاقا',
  'کارا',
  'اونا',
  'اینا',
  'همینه',
  'همون',
  'همین',
  'چیزا',
  'بچه‌ها',
  'خوبه',
  'بدونم',
  'بدونی',
  'بگیره',
  'بیاد',
  'بره',
  'بود',
  'بزنم',
  'بکنم',
  'بگم',
  'بدم',
  'کنیم',
  'کردم',
  'گفتم',
  'داشتم',
  'اومد',
  'اومدم',
  'میشه',
  'نشه',
  'بشه',
  'خایه',
  'حروم',
  'دیونه',
  'نباش',
  'بودش',
  'گندش'
])

const dict = new Set(JSON.parse(readFileSync(dictPath, 'utf8')).map(norm))

const seen = new Set()
const words = []
for (const line of readFileSync(freqPath, 'utf8').split('\n')) {
  const [raw, count] = line.trim().split(/\s+/)
  if (!raw) continue
  const w = norm(raw)
  if (!PURE.test(w) || w.length < 4 || w.length > 9 || seen.has(w)) continue
  // فقط کلماتی که در واژه‌نامه هم هستند (حذف عامیانه‌نویسی و غلط املایی)
  if (!dict.has(w)) continue
  // افعال صرف‌شدهٔ عامیانه (میرم، نمیخوام…) به‌جز چند اسم واقعی با پیشوند «می»
  if (/^(می|نمی)/.test(w) && !MI_OK.has(w)) continue
  // مصدرها و کلمات عامیانهٔ پایان‌یافته با «ه» پس از فعل (خالیه، باشه) نگه داشته نمی‌شوند
  if (COLLOQUIAL.has(w)) continue
  seen.add(w)
  words.push({ w, c: Number(count) })
}

// آسان = رایج‌تر؛ فقط ۴۰۰۰ کلمهٔ پرتکرار نگه داشته می‌شود
const out = words.slice(0, 4000).map((x) => x.w)
writeFileSync(outPath, JSON.stringify(out))
const byLen = {}
for (const w of out) byLen[w.length] = (byLen[w.length] || 0) + 1
console.log(`ذخیره شد: ${out.length} کلمه`, JSON.stringify(byLen))
console.log('نمونه:', out.filter((_, i) => i % 150 === 0).join(' '))
