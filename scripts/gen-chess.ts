// تولید آفلاین معماهای شطرنج «مات در ۱» و «مات در ۲» با موقعیت‌های تصادفی که با chess.js تأیید شده‌اند
// استفاده: npx tsx scripts/gen-chess.ts [خروجی]
import { writeFileSync } from 'node:fs'
import { Chess, validateFen } from 'chess.js'
import { mateInOneMoves, mateInTwoFirstMoves } from '../shared/games/chess'

const out = process.argv[2] ?? 'prisma/data/chess-puzzles.json'

let seed = 20261101
const rng = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296
  return seed / 4294967296
}
const pick = <T>(a: T[]) => a[Math.floor(rng() * a.length)]!

const FILES = 'abcdefgh'
const sq = (f: number, r: number) => `${FILES[f]}${r + 1}`

/** موقعیت تصادفی: شاه سیاه بیشتر کنار صفحه، چند پیادهٔ مدافع، شاه سفید و چند مهرهٔ حمله */
function randomFen(attackers: number, blackExtras: number): string | null {
  const board = new Map<string, string>()
  const put = (s: string, p: string) => (board.has(s) ? false : (board.set(s, p), true))

  // شاه سیاه: ۷۰٪ روی ردیف ۸ یا ستون کنار
  const bk =
    rng() < 0.7
      ? rng() < 0.6
        ? [Math.floor(rng() * 8), 7]
        : [pick([0, 7]), 3 + Math.floor(rng() * 5)]
      : [Math.floor(rng() * 8), 4 + Math.floor(rng() * 4)]
  put(sq(bk[0]!, bk[1]!), 'k')
  // پیاده‌های جلوی شاه سیاه
  const pawns = Math.floor(rng() * 4)
  for (let i = 0; i < pawns; i++) {
    const f = bk[0]! + pick([-1, 0, 1])
    const r = bk[1]! - 1
    if (f >= 0 && f < 8 && r >= 1 && r <= 6) put(sq(f, r), 'p')
  }
  for (let i = 0; i < blackExtras; i++) put(sq(Math.floor(rng() * 8), 2 + Math.floor(rng() * 6)), pick(['r', 'n', 'b', 'p']))

  // شاه سفید دور از شاه سیاه
  let wk: number[]
  do wk = [Math.floor(rng() * 8), Math.floor(rng() * 5)]
  while (Math.abs(wk[0]! - bk[0]!) <= 1 && Math.abs(wk[1]! - bk[1]!) <= 1)
  put(sq(wk[0]!, wk[1]!), 'K')
  for (let i = 0; i < attackers; i++) put(sq(Math.floor(rng() * 8), Math.floor(rng() * 8)), pick(['Q', 'R', 'R', 'B', 'N', 'B']))

  // ساخت FEN
  const rows: string[] = []
  for (let r = 7; r >= 0; r--) {
    let row = ''
    let empty = 0
    for (let f = 0; f < 8; f++) {
      const p = board.get(sq(f, r))
      if (!p) empty++
      else {
        if (empty) row += empty
        empty = 0
        if ((p === 'p' || p === 'P') && (r === 0 || r === 7)) return null
        row += p
      }
    }
    rows.push(row + (empty || ''))
  }
  const fen = `${rows.join('/')} w - - 0 1`
  if (!validateFen(fen).ok) return null
  // سیاه نباید در کیش باشد (نوبت سفید است) و سفید هم در کیش نباشد
  if (new Chess(fen.replace(' w ', ' b ')).isCheck()) return null
  const g = new Chess(fen)
  if (g.isCheck() || g.isGameOver()) return null
  return fen
}

type Out = { fen: string; mateIn: 1 | 2; level: 1 | 2 | 3 }
const result: Out[] = []
const seen = new Set<string>()

function collect(level: 1 | 2 | 3, target: number, attackers: () => number, extras: () => number, maxTries: number) {
  let found = 0
  for (let t = 0; t < maxTries && found < target; t++) {
    const fen = randomFen(attackers(), extras())
    if (!fen || seen.has(fen)) continue
    const m1 = mateInOneMoves(fen)
    if (level < 3) {
      // معمای خوب: دقیقاً یک حرکت مات‌کننده
      if (m1.length !== 1) continue
    } else {
      if (m1.length) continue
      if (new Chess(fen).moves().length > 40) continue // جست‌وجو را ارزان نگه می‌داریم
      const m2 = mateInTwoFirstMoves(fen)
      if (m2.length !== 1) continue
    }
    seen.add(fen)
    result.push({ fen, mateIn: level < 3 ? 1 : 2, level })
    found++
  }
  console.log(`سطح ${level}: ${found} معما`)
}

collect(
  1,
  60,
  () => 1 + Math.floor(rng() * 2),
  () => 0,
  400_000
)
collect(
  2,
  60,
  () => 2 + Math.floor(rng() * 2),
  () => 1 + Math.floor(rng() * 2),
  400_000
)
collect(
  3,
  30,
  () => 2 + Math.floor(rng() * 2),
  () => Math.floor(rng() * 2),
  3_000_000
)

writeFileSync(out, JSON.stringify(result))
console.log(`ذخیره شد: ${result.length} معما در ${out}`)
