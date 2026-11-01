import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { Chess } from 'chess.js'
import { bestDefence, isMateInTwoFirstMove, mateInOneMoves, mateInTwoFirstMoves, puzzleScore } from '../../shared/games/chess'

const puzzles = JSON.parse(readFileSync(new URL('../../prisma/data/chess-puzzles.json', import.meta.url), 'utf8')) as {
  fen: string
  mateIn: 1 | 2
  level: number
}[]

describe('معمای شطرنج', () => {
  it('بانک: ۸۰/۸۰/۶۰ از Lichess، همه FEN معتبر با نوبت سفید', () => {
    expect([1, 2, 3].map((l) => puzzles.filter((p) => p.level === l).length)).toEqual([80, 80, 60])
    expect(puzzles.every((p) => /^lichess:\w+$/.test((p as { source?: string }).source ?? ''))).toBe(true)
    for (const p of puzzles) {
      const g = new Chess(p.fen)
      expect(g.turn()).toBe('w')
      expect(g.isGameOver()).toBe(false)
    }
  })

  it('هر معمای مات در ۱ دقیقاً یک حرکت مات‌کننده دارد', () => {
    for (const p of puzzles.filter((x) => x.mateIn === 1)) expect(mateInOneMoves(p.fen)).toHaveLength(1)
  })

  it('مات در ۲: مات فوری ندارد و حرکت اول یکتا با هر دفاعی به مات می‌رسد', { timeout: 120_000 }, () => {
    for (const p of puzzles.filter((x) => x.mateIn === 2).slice(0, 6)) {
      expect(mateInOneMoves(p.fen)).toHaveLength(0)
      const first = mateInTwoFirstMoves(p.fen)
      expect(first).toHaveLength(1)
      // اجرای کامل: حرکت اول ← بهترین دفاع ← مات
      const g = new Chess(p.fen)
      g.move({ from: first[0]!.slice(0, 2), to: first[0]!.slice(2, 4), promotion: first[0]![4] })
      if (!g.isCheckmate()) {
        const d = bestDefence(g.fen(), () => 0)!
        g.move({ from: d.slice(0, 2), to: d.slice(2, 4), promotion: d[4] })
        expect(mateInOneMoves(g.fen()).length).toBeGreaterThan(0)
      }
    }
  })

  it('حرکت اول نادرست پذیرفته نمی‌شود', () => {
    const p = puzzles.find((x) => x.mateIn === 2)!
    const right = mateInTwoFirstMoves(p.fen)[0]
    const wrong = new Chess(p.fen)
      .moves({ verbose: true })
      .map((m) => `${m.from}${m.to}${m.promotion ?? ''}`)
      .find((m) => m !== right)!
    expect(isMateInTwoFirstMove(p.fen, wrong)).toBe(false)
    expect(puzzleScore(true, 2, 30)).toBe(50)
  })
})
