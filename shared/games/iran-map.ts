// منطق «نقشهٔ ایران»: شناخت استان‌ها و مراکزشان روی نقشه
export type Rng = () => number
export type Difficulty = 1 | 2 | 3

export interface Province {
  name: string
  capital: string
  lat: number
  lon: number
}
export interface MapData {
  /** مختصات تقریبی مراکز (برای انتخاب استان‌های همسایه به‌عنوان گزینهٔ غلط) */
  provinces: Province[]
  /** مرز استان‌ها به‌صورت مسیر SVG در این viewBox */
  viewBox: string
  shapes: { name: string; d: string }[]
}

export type MapRoundKind = 'which' | 'find' | 'capital'
export interface MapRound {
  kind: MapRoundKind
  /** اندیس استان هدف */
  target: number
  /** برای which/capital: گزینه‌های متنی */
  options: string[]
  answer: string
}

export const MP = { rounds: 12, seconds: { 1: 20, 2: 15, 3: 12 } as Record<Difficulty, number> }

const shuffle = <T>(a: readonly T[], rng: Rng): T[] => {
  const r = [...a]
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[r[i], r[j]] = [r[j]!, r[i]!]
  }
  return r
}
const dist = (a: Province, b: Province) => Math.hypot(a.lat - b.lat, (a.lon - b.lon) * 0.85)

/**
 * دورها: آسان «این نقطه کدام استان است؟» و «مرکز استان؟»؛ متوسط و سخت «استان را روی نقشه پیدا کن» هم دارند.
 * در سخت، گزینه‌های غلط از نزدیک‌ترین استان‌های همسایه انتخاب می‌شوند.
 */
export function buildMapRounds(ps: Province[], difficulty: Difficulty, n = MP.rounds, rng: Rng = Math.random): MapRound[] {
  const kinds: MapRoundKind[] = difficulty === 1 ? ['which', 'capital'] : ['which', 'capital', 'find']
  const targets = shuffle(
    ps.map((_, i) => i),
    rng
  ).slice(0, n)
  return targets.map((t) => {
    const kind = kinds[Math.floor(rng() * kinds.length)]!
    const others = ps.map((_, i) => i).filter((i) => i !== t)
    const pool = difficulty === 3 ? others.sort((a, b) => dist(ps[a]!, ps[t]!) - dist(ps[b]!, ps[t]!)).slice(0, 5) : others
    const wrong = shuffle(pool, rng).slice(0, 3)
    if (kind === 'capital') {
      return { kind, target: t, answer: ps[t]!.capital, options: shuffle([ps[t]!.capital, ...wrong.map((i) => ps[i]!.capital)], rng) }
    }
    return {
      kind,
      target: t,
      answer: ps[t]!.name,
      options: kind === 'which' ? shuffle([ps[t]!.name, ...wrong.map((i) => ps[i]!.name)], rng) : []
    }
  })
}

/** درست: ۱۰ + نصف ثانیه‌های باقی‌مانده */
export const mapDelta = (ok: boolean, secondsLeft: number) => (ok ? 10 + Math.floor(Math.max(0, secondsLeft) / 2) : 0)
