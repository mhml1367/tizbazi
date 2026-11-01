// منطق «کلمه‌روز» (وردل فارسی): ۵ حرف، ۶ حدس
import { lettersOf } from '../persian'

export const WD = { length: 5, maxGuesses: 6 }

/** g = درست سر جا، y = هست ولی جای دیگر، b = نیست */
export type Mark = 'g' | 'y' | 'b'

/** علامت‌گذاری حدس با رعایت حروف تکراری (مثل وردل اصلی) */
export function markGuess(guess: string, answer: string): Mark[] {
  const g = lettersOf(guess)
  const a = lettersOf(answer)
  const marks: Mark[] = g.map(() => 'b')
  const remaining = new Map<string, number>()
  g.forEach((ch, i) => {
    if (a[i] === ch) marks[i] = 'g'
    else remaining.set(a[i]!, (remaining.get(a[i]!) ?? 0) + 1)
  })
  g.forEach((ch, i) => {
    if (marks[i] === 'g') return
    const left = remaining.get(ch) ?? 0
    if (left > 0) {
      marks[i] = 'y'
      remaining.set(ch, left - 1)
    }
  })
  return marks
}

/** کلمهٔ ۵ حرفی بدون نیم‌فاصله و فقط حروف فارسی */
export const isFiveLetters = (w: string) => lettersOf(w).length === WD.length && lettersOf(w).join('') === w

/** امتیاز: حل در n حدس → (۷ − n) × ۲۰ · حل‌نشده → ۰ */
export const wordleScore = (solved: boolean, guesses: number) => (solved ? (WD.maxGuesses + 1 - guesses) * 20 : 0)

/** اندیس جواب روز (قطعی برای همهٔ کاربران) */
export function dailyIndex(dayKey: string, count: number): number {
  let h = 0x811c9dc5
  for (const c of `wordle:${dayKey}`) {
    h ^= c.charCodeAt(0)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0) % count
}

/** چیدمان صفحه‌کلید فارسی استاندارد */
export const KEYBOARD_ROWS = [Array.from('ضصثقفغعهخحجچ'), Array.from('شسیبلاتنمکگ'), Array.from('ظطزرذدپوژآ')]

/** متن اشتراک‌گذاری بدون لو دادن جواب */
export function shareText(title: string, guesses: Mark[][], solved: boolean): string {
  const emoji = { g: '🟩', y: '🟨', b: '⬜' } as const
  const head = `${title} ${solved ? guesses.length : 'X'}/${WD.maxGuesses}`
  return [head, ...guesses.map((row) => row.map((m) => emoji[m]).join(''))].join('\n')
}
