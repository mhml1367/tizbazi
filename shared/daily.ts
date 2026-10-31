import { GAME_IDS, type GameId } from './validation'

/** عدد قطعی از کلید روز (FNV-1a) */
function hash(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** سه بازیِ «چالش امروز»؛ برای همهٔ کاربران در یک روز یکسان و بین روزها متفاوت */
export function dailyChallenge(dayKey: string): GameId[] {
  const rng = mulberry32(hash(`tizbazi:${dayKey}`))
  const a = [...GAME_IDS]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a.slice(0, 3)
}
