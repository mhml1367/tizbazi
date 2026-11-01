// یکدست‌سازی متن فارسی برای مقایسهٔ کلمات (ی/ي، ک/ك، اعراب، کشیده، نیم‌فاصله و فاصله)

/** شکل یکدست برای نمایش و ذخیره: ی/ک فارسی، بدون اعراب و کشیده */
export const normalizeFa = (s: string) =>
  s
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/ة/g, 'ه')
    .replace(/[أإٱ]/g, 'ا')
    .replace(/ؤ/g, 'و')
    .replace(/[ً-ْٰـ]/g, '')
    .trim()

/** کلید مقایسه: علاوه بر یکدست‌سازی، نیم‌فاصله و فاصله حذف می‌شود */
export const compareKey = (s: string) => normalizeFa(s).replace(/[\s‌]/g, '')

/** حروف (نه نشانه‌ها) به ترتیب */
export const lettersOf = (s: string) => Array.from(compareKey(s)).filter((c) => /[ء-ۿ]/.test(c))

/** حرف اول با «آ» = «ا» */
export function firstLetter(s: string): string {
  const l = lettersOf(s)[0] ?? ''
  return l === 'آ' ? 'ا' : l
}

/** حرف آخر (حروف غیرالفبایی انتهایی نادیده گرفته می‌شوند)؛ «آ» = «ا» */
export function lastLetter(s: string): string {
  const ls = lettersOf(s)
  const l = ls[ls.length - 1] ?? ''
  return l === 'آ' ? 'ا' : l === 'ء' ? (ls[ls.length - 2] ?? '') : l
}

/** حروف الفبای فارسی (برای کیبورد و بازی‌ها) */
export const FA_ALPHABET = Array.from('آابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی')

/** عدد با ارقام فارسی و جداکنندهٔ هزارگان */
export const faNumber = (n: number) => n.toLocaleString('fa-IR')
