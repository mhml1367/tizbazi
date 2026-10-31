// منطق تولید سؤال و امتیاز بازی استروپ؛ مستقل از UI

export type Rng = () => number

export const STROOP_COLORS = [
  { key: 'red', label: 'قرمز' },
  { key: 'blue', label: 'آبی' },
  { key: 'green', label: 'سبز' },
  { key: 'yellow', label: 'زرد' },
  { key: 'purple', label: 'بنفش' },
  { key: 'orange', label: 'نارنجی' }
] as const
export type ColorKey = (typeof STROOP_COLORS)[number]['key']

export const STROOP_DIRS = [
  { key: 'up', label: 'بالا', arrow: '↑' },
  { key: 'down', label: 'پایین', arrow: '↓' },
  { key: 'left', label: 'چپ', arrow: '←' },
  { key: 'right', label: 'راست', arrow: '→' }
] as const
export type DirKey = (typeof STROOP_DIRS)[number]['key']

export type Difficulty = 1 | 2 | 3
export type QuestionKind = 'color' | 'direction' | 'both'

export interface StroopQuestion {
  kind: QuestionKind
  /** کلمهٔ رنگ نمایش‌داده‌شده (معنا) */
  wordColor: ColorKey
  /** رنگ واقعی متن */
  inkColor: ColorKey
  /** جهت واقعی فلش */
  arrowDir: DirKey
  /** جهتی که کلمهٔ کنار فلش می‌گوید (گمراه‌کننده) */
  wordDir: DirKey
  /** پاسخ‌های درست مورد انتظار */
  answer: { color?: ColorKey; direction?: DirKey }
}

export const STROOP_LIMITS = { questions: 20, seconds: 30 }

const pick = <T>(arr: readonly T[], rng: Rng): T => arr[Math.floor(rng() * arr.length)]!
const pickOther = <T>(arr: readonly T[], not: T, rng: Rng): T =>
  pick(
    arr.filter((x) => x !== not),
    rng
  )

/** آسان: فقط رنگ (۴ رنگ) · متوسط: رنگ یا جهت (۶ رنگ) · سخت: هر دو بُعد همزمان */
export function generateQuestion(difficulty: Difficulty, rng: Rng = Math.random): StroopQuestion {
  const colors = (difficulty === 1 ? STROOP_COLORS.slice(0, 4) : STROOP_COLORS).map((c) => c.key)
  const dirKeys = STROOP_DIRS.map((d) => d.key)

  const kind: QuestionKind = difficulty === 1 ? 'color' : difficulty === 2 ? (rng() < 0.5 ? 'color' : 'direction') : 'both'

  const wordColor = pick(colors, rng)
  // در استروپ، رنگ متن همیشه با معنای کلمه ناهمخوان است
  const inkColor = pickOther(colors, wordColor, rng)
  const arrowDir = pick(dirKeys, rng)
  const wordDir = pickOther(dirKeys, arrowDir, rng)

  const answer =
    kind === 'color' ? { color: inkColor } : kind === 'direction' ? { direction: arrowDir } : { color: inkColor, direction: arrowDir }
  return { kind, wordColor, inkColor, arrowDir, wordDir, answer }
}

export interface StroopGiven {
  color?: ColorKey
  direction?: DirKey
}

/** همهٔ ابعاد پرسیده‌شده باید درست پاسخ داده شده باشند */
export function isCorrect(q: StroopQuestion, given: StroopGiven): boolean {
  if (q.answer.color !== undefined && given.color !== q.answer.color) return false
  if (q.answer.direction !== undefined && given.direction !== q.answer.direction) return false
  return true
}

/** امتیاز: درست − نصف غلط (حداقل صفر، گرد به عدد صحیح) */
export function computeScore(correct: number, wrong: number): number {
  return Math.max(0, Math.round(correct - wrong / 2))
}

export function computeAccuracy(correct: number, wrong: number): number {
  const total = correct + wrong
  return total === 0 ? 0 : Math.round((correct / total) * 1000) / 10
}
