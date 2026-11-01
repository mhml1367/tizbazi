// واکنش صفحهٔ نتیجه به امتیاز: رکورد، عالی، خوب، کم، صفر

export type Tier = 'record' | 'great' | 'good' | 'low' | 'zero'

export interface RecordInfo {
  /** بهترین امتیاز قبلی این بازی؛ null یعنی اولین بار */
  prevBest: number | null
  isNew: boolean
}

/**
 * سطح واکنش. رکورد شخصی فقط وقتی جشن گرفته می‌شود که امتیاز دست‌کم «خوب» باشد،
 * تا شکستن رکوردِ ۵ امتیازی با ۶ امتیاز جشن نداشته باشد.
 */
export function resultTier(score: number, good: number, great: number, record?: RecordInfo | null): Tier {
  if (score <= 0) return 'zero'
  if (record?.isNew && score >= good) return 'record'
  if (score >= great) return 'great'
  if (score >= good) return 'good'
  return 'low'
}

export const TIER_EMOJI: Record<Tier, string[]> = {
  record: ['🏆', '👑', '🥇'],
  great: ['🤩', '🔥', '🚀', '⚡'],
  good: ['😎', '👏', '🌟', '😊'],
  low: ['💪', '🙂', '🌱'],
  zero: ['😅', '🙃']
}

export const TIER_LINES: Record<Tier, string[]> = {
  record: ['رکورد خودت را شکستی!', 'رکورد تازه! از خودت هم جلو زدی', 'بهترین بازی‌ات تا امروز!'],
  great: ['فوق‌العاده بود!', 'ذهنت مثل تیغ تیز است!', 'ایول! بی‌نظیر بازی کردی', 'دمت گرم، حرف نداشت!'],
  good: ['آفرین! خوب بود', 'داری حرفه‌ای می‌شوی', 'خوب پیش رفتی، ادامه بده', 'نتیجهٔ خوبی بود!'],
  low: ['اشکال ندارد، دفعهٔ بعد بهتر می‌شود', 'کار نیکو کردن از پر کردن است!', 'تازه گرم شدی؛ یک دور دیگر؟', 'قدم‌به‌قدم بهتر می‌شوی'],
  zero: ['این دور حساب نیست! دوباره بزن', 'گاهی پیش می‌آید؛ یک بار دیگر امتحان کن']
}

/** انتخاب قطعی از فهرست با بذر (تا با هر رندر دوباره عوض نشود) */
export const pickBySeed = <T>(list: T[], seed: number): T => list[Math.abs(Math.floor(seed)) % list.length]!
