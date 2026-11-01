// حل‌کنندهٔ ساده برای معماهای «مات در ۱» و «مات در ۲» بر پایهٔ chess.js
import { Chess, type Move } from 'chess.js'

export type Rng = () => number
export type Difficulty = 1 | 2 | 3

export interface ChessPuzzle {
  fen: string
  mateIn: 1 | 2
}

/** آسان و متوسط: مات در ۱ · سخت: مات در ۲ */
export const CP = {
  puzzles: { 1: 5, 2: 5, 3: 3 } as Record<Difficulty, number>,
  seconds: { 1: 60, 2: 60, 3: 120 } as Record<Difficulty, number>
}

export const uci = (m: Pick<Move, 'from' | 'to' | 'promotion'>) => `${m.from}${m.to}${m.promotion ?? ''}`

/** همهٔ حرکت‌هایی که فوراً مات می‌کنند (به‌صورت uci) */
export function mateInOneMoves(fen: string): string[] {
  const g = new Chess(fen)
  const out: string[] = []
  for (const m of g.moves({ verbose: true })) {
    g.move(m)
    if (g.isCheckmate()) out.push(uci(m))
    g.undo()
  }
  return out
}

/** آیا پس از این حرکت سفید، برای هر پاسخ سیاه یک مات فوری وجود دارد؟ (یعنی حرکت اول درست مات در ۲) */
export function isMateInTwoFirstMove(fen: string, move: string): boolean {
  const g = new Chess(fen)
  try {
    g.move({ from: move.slice(0, 2), to: move.slice(2, 4), promotion: move[4] })
  } catch {
    return false
  }
  if (g.isCheckmate()) return true // مات زودتر هم قابل قبول است
  const replies = g.moves({ verbose: true })
  if (!replies.length) return false // پات
  for (const r of replies) {
    g.move(r)
    const ok = mateInOneMoves(g.fen()).length > 0
    g.undo()
    if (!ok) return false
  }
  return true
}

/** حرکت‌های اولِ درست برای مات در ۲ */
export function mateInTwoFirstMoves(fen: string): string[] {
  const g = new Chess(fen)
  return g
    .moves({ verbose: true })
    .map(uci)
    .filter((m) => isMateInTwoFirstMove(fen, m))
}

/** بهترین دفاع سیاه پس از حرکت اول: پاسخی که ماتش برای سفید کمترین راه را دارد (برای سخت‌تر کردن) */
export function bestDefence(fen: string, rng: Rng = Math.random): string | null {
  const g = new Chess(fen)
  const replies = g.moves({ verbose: true })
  if (!replies.length) return null
  let best: Move[] = []
  let fewest = Infinity
  for (const r of replies) {
    g.move(r)
    const n = mateInOneMoves(g.fen()).length || 99
    g.undo()
    if (n < fewest) {
      fewest = n
      best = [r]
    } else if (n === fewest) best.push(r)
  }
  return uci(best[Math.floor(rng() * best.length)]!)
}

/** امتیاز معما: مات در ۱ → ۲۰، مات در ۲ → ۴۰، به‌علاوهٔ ثلث ثانیه‌های باقی‌مانده */
export const puzzleScore = (solved: boolean, mateIn: 1 | 2, secondsLeft: number) =>
  solved ? (mateIn === 1 ? 20 : 40) + Math.floor(Math.max(0, secondsLeft) / 3) : 0
