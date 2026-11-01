// منطق «اسم‌فامیل»: یک حرف، چند دسته، زمان محدود
import { compareKey, firstLetter } from '../persian'

export type Rng = () => number
export type Difficulty = 1 | 2 | 3

export const EF_CATEGORIES = [
  { id: 'name', label: 'اسم' },
  { id: 'family', label: 'فامیل' },
  { id: 'city', label: 'شهر' },
  { id: 'country', label: 'کشور' },
  { id: 'animal', label: 'حیوان' },
  { id: 'food', label: 'غذا' },
  { id: 'fruit', label: 'میوه' },
  { id: 'color', label: 'رنگ' },
  { id: 'object', label: 'اشیا' }
] as const
export type EfCategory = (typeof EF_CATEGORIES)[number]['id']

/** حروفی که برای همهٔ دسته‌ها جواب معقول دارند (حروف کم‌کاربرد حذف شده‌اند) */
export const EF_LETTERS = Array.from('ابپتجچحخدرزسشصفقکگلمنوهی')

/** آسان: ۵ دسته و ۱۲۰ ثانیه · متوسط: ۷ دسته و ۹۰ ثانیه · سخت: ۹ دسته و ۷۵ ثانیه */
export const EF_RULES: Record<Difficulty, { categories: number; seconds: number }> = {
  1: { categories: 5, seconds: 120 },
  2: { categories: 7, seconds: 90 },
  3: { categories: 9, seconds: 75 }
}

export const EF_POINTS = { verified: 10, word: 3 }

export function pickRound(difficulty: Difficulty, rng: Rng = Math.random) {
  const letter = EF_LETTERS[Math.floor(rng() * EF_LETTERS.length)]!
  const categories = EF_CATEGORIES.slice(0, EF_RULES[difficulty].categories).map((c) => c.id)
  return { letter, categories, seconds: EF_RULES[difficulty].seconds }
}

export type EfStatus = 'verified' | 'word' | 'wrong-letter' | 'unknown' | 'empty'

/**
 * داوری یک پاسخ:
 *  verified — در بانک همان دسته هست (۱۰ امتیاز)
 *  word     — کلمهٔ واقعی فارسی است که با حرف درست شروع می‌شود ولی در بانک دسته نیست (۳ امتیاز؛ بانک کامل نیست)
 */
export function judge(
  answer: string,
  letter: string,
  bank: Set<string>,
  dictionary: Set<string>,
  /** فقط برای دستهٔ «فامیل»: ریشه‌هایی که با پسوند فامیلی ساخته می‌شوند (اسم‌ها و شهرها) */
  surnameStems?: Set<string>
): { status: EfStatus; points: number } {
  const key = compareKey(answer)
  if (!key) return { status: 'empty', points: 0 }
  if (firstLetter(key) !== (letter === 'آ' ? 'ا' : letter)) return { status: 'wrong-letter', points: 0 }
  if (variants(key).some((k) => bank.has(k))) return { status: 'verified', points: EF_POINTS.verified }
  if (surnameStems && isSurname(key, surnameStems, dictionary)) return { status: 'verified', points: EF_POINTS.verified }
  if (dictionary.has(key)) return { status: 'word', points: EF_POINTS.word }
  return { status: 'unknown', points: 0 }
}

/** «آمریکا» و «امریکا» هر دو پذیرفته شوند */
const variants = (key: string) => [key, key.startsWith('آ') ? 'ا' + key.slice(1) : key.startsWith('ا') ? 'آ' + key.slice(1) : key]

/** پسوندهای رایج نام خانوادگی؛ «ی/یی/ئی» فقط با ریشه‌های اسم و شهر، بقیه با هر کلمهٔ واژه‌نامه هم */
const SHORT_SUFFIXES = ['یان', 'ی', 'یی', 'ئی', 'لو', 'وند', 'زاده', 'پور', 'نژاد', 'فر', 'نیا', 'کیا', 'راد', 'مهر', 'بیگی', 'خانی']
const LONG_SUFFIXES = [
  'زاده',
  'پور',
  'نژاد',
  'فر',
  'نیا',
  'کیا',
  'راد',
  'مهر',
  'ور',
  'مند',
  'منش',
  'دوست',
  'پناه',
  'بخش',
  'خواه',
  'فرد',
  'زند',
  'آبادی'
]

/**
 * نام خانوادگی ساخته‌شده از ریشه + پسوند: احمدی، رضایی، تهرانی، حسین‌زاده، دانشور، نیک‌منش، …
 * ریشه باید دست‌کم دو حرف باشد.
 */
export function isSurname(key: string, stems: Set<string>, dictionary: Set<string>): boolean {
  for (const suf of SHORT_SUFFIXES) {
    if (!key.endsWith(suf)) continue
    const stem = key.slice(0, -suf.length)
    if (stem.length >= 2 && variants(stem).some((s) => stems.has(s) || stems.has(s + 'ه'))) return true
  }
  for (const suf of LONG_SUFFIXES) {
    if (!key.endsWith(suf)) continue
    const stem = key.slice(0, -suf.length)
    if (stem.length >= 2 && (dictionary.has(stem) || stems.has(stem))) return true
  }
  return false
}

/** بونوس زمان: یک امتیاز برای هر ۵ ثانیهٔ باقی‌مانده، فقط وقتی دست‌کم نیمی از دسته‌ها تأیید شده باشند */
export function timeBonus(secondsLeft: number, verified: number, categories: number) {
  return verified * 2 >= categories ? Math.floor(Math.max(0, secondsLeft) / 5) : 0
}
