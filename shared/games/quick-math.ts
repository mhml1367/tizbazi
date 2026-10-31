// منطق بازی «محاسبات سریع»؛ مستقل از UI

export type Rng = () => number
export type Difficulty = 1 | 2 | 3

export const QM_LIMITS = { questions: 20, seconds: 60, bonusWindow: 5 }

export interface MathQuestion {
  /** عبارت نمایشی، مثل «۸ × ۷» (ارقام لاتین؛ UI فارسی‌سازی می‌کند) */
  text: string
  answer: number
  options: number[]
}

const int = (min: number, max: number, rng: Rng) => min + Math.floor(rng() * (max - min + 1))

const shuffle = <T>(arr: T[], rng: Rng): T[] => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

/** آسان: جمع/تفریق ۱–۲۰ (بدون جواب منفی) · متوسط: ضرب ۱–۱۲ · سخت: تقسیم صحیح یا ترکیب ضرب و جمع/تفریق */
export function makeExpression(difficulty: Difficulty, rng: Rng): { text: string; answer: number } {
  if (difficulty === 1) {
    const a = int(1, 20, rng)
    const b = int(1, 20, rng)
    return rng() < 0.5 ? { text: `${a} + ${b}`, answer: a + b } : { text: `${Math.max(a, b)} − ${Math.min(a, b)}`, answer: Math.abs(a - b) }
  }
  if (difficulty === 2) {
    const a = int(2, 12, rng)
    const b = int(2, 12, rng)
    return { text: `${a} × ${b}`, answer: a * b }
  }
  if (rng() < 0.5) {
    const b = int(2, 12, rng)
    const q = int(2, 12, rng)
    return { text: `${b * q} ÷ ${b}`, answer: q }
  }
  const a = int(2, 12, rng)
  const b = int(2, 12, rng)
  const c = int(1, 30, rng)
  return rng() < 0.5
    ? { text: `${a} × ${b} + ${c}`, answer: a * b + c }
    : { text: `${a} × ${b} − ${Math.min(c, a * b - 1)}`, answer: a * b - Math.min(c, a * b - 1) }
}

/** ۳ مزاحم نزدیک به جواب (یکتا، غیرمنفی، ≠ جواب) */
export function makeOptions(answer: number, rng: Rng): number[] {
  const set = new Set<number>([answer])
  const spread = Math.max(4, Math.ceil(answer * 0.2))
  let guard = 0
  while (set.size < 4 && guard++ < 200) {
    const v = answer + int(-spread, spread, rng)
    if (v >= 0) set.add(v)
  }
  // در حالت نادر کمبود مزاحم، اعداد بعدی را اضافه می‌کنیم
  for (let v = answer + 1; set.size < 4; v++) set.add(v)
  return shuffle([...set], rng)
}

export function generateQuestion(difficulty: Difficulty, rng: Rng = Math.random): MathQuestion {
  const { text, answer } = makeExpression(difficulty, rng)
  return { text, answer, options: makeOptions(answer, rng) }
}

/** هر پاسخ درست ۵ امتیاز + بونوس سرعت (تا ۵ امتیاز، برای هر ثانیه تأخیر یکی کمتر) */
export function answerScore(correct: boolean, elapsedMs: number): number {
  if (!correct) return 0
  return 5 + Math.max(0, QM_LIMITS.bonusWindow - Math.floor(elapsedMs / 1000))
}
