// ساخت prisma/data/chess-puzzles.json از پایگاه معماهای Lichess (CC0: https://database.lichess.org/#puzzles)
// معماها از بازی‌های واقعی‌اند. فقط ابتدای فایل لازم است (چند مگابایت کافی است):
//   curl -r 0-6000000 -o head.csv.zst https://database.lichess.org/lichess_db_puzzle.csv.zst
//   npx tsx scripts/build-chess-lichess.ts head.csv.zst
// قالب CSV: PuzzleId,FEN,Moves,Rating,RatingDeviation,Popularity,NbPlays,Themes,GameUrl,OpeningTags
// FEN موقعیت پیش از حرکت حریف است؛ حرکت اول Moves را می‌زنیم تا موقعیت معما به دست بیاید.
// موقعیت‌های «سیاه بازی می‌کند» قرینه می‌شوند تا همیشه سفید حرکت کند (صفحهٔ بازی فقط از دید سفید است).
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createZstdDecompress } from 'node:zlib'
import { Chess } from 'chess.js'
import { isMateInTwoFirstMove, mateInOneMoves } from '../shared/games/chess'

let raw = readFileSync(process.argv[2]!)
// فایل Lichess با یک «فریم پرش‌پذیر» zstd شروع می‌شود که zlib نمی‌شناسد؛ کنارش می‌گذاریم
while ((raw.readUInt32LE(0) & 0xfffffff0) === 0x184d2a50) raw = raw.subarray(8 + raw.readUInt32LE(4))
// فایل بریده‌شده است؛ جریانی باز می‌کنیم و با خطای پایان ناقص، هرچه باز شده را نگه می‌داریم
const chunks: Buffer[] = []
await new Promise<void>((resolve) => {
  const z = createZstdDecompress()
  z.on('data', (c: Buffer) => chunks.push(c))
  z.on('end', resolve)
  z.on('error', () => resolve())
  z.end(raw)
})
const text = Buffer.concat(chunks).toString('utf8')
console.log(`${(text.length / 1e6).toFixed(1)}M نویسه باز شد`)

/** قرینهٔ رنگ: ردیف‌ها وارونه، حروف بزرگ و کوچک جابه‌جا، نوبت و حق قلعه هم */
function mirror(fen: string): string {
  const [board, turn, castling, ep, half, full] = fen.split(' ')
  const swap = (s: string) => s.replace(/[a-zA-Z]/g, (c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()))
  const b = board!.split('/').reverse().map(swap).join('/')
  const sw = castling === '-' ? '' : swap(castling!)
  const c = ['K', 'Q', 'k', 'q'].filter((x) => sw.includes(x)).join('') || '-'
  const e = ep === '-' ? '-' : ep![0] + String(9 - Number(ep![1]))
  return [b, turn === 'w' ? 'b' : 'w', c, e, half, full].join(' ')
}

/** حرکت UCI در صفحهٔ قرینه: ستون همان، ردیف وارونه */
const mirrorMove = (m: string) => m[0] + String(9 - Number(m[1])) + m[2] + String(9 - Number(m[3])) + (m[4] ?? '')

type Level = 1 | 2 | 3
const want: Record<Level, number> = { 1: 80, 2: 80, 3: 60 }
const pick: { fen: string; mateIn: 1 | 2; level: Level; source: string }[] = []
const count = (l: Level) => pick.filter((p) => p.level === l).length

for (const line of text.split('\n').slice(1)) {
  if (([1, 2, 3] as const).every((l) => count(l) >= want[l])) break
  const f = line.split(',')
  if (f.length < 9) continue
  const [id, fen0, moves, rating, , popularity, nbPlays, themes] = f
  const mateIn = themes!.includes('mateIn1') ? 1 : themes!.includes('mateIn2') ? 2 : 0
  if (!mateIn || Number(popularity) < 80 || Number(nbPlays) < 300) continue
  // آسان: مات در ۱ تا ریتینگ ۱۲۰۰ · متوسط: مات در ۱ دشوارتر · سخت: مات در ۲
  const level: Level = mateIn === 2 ? 3 : Number(rating) < 1200 ? 1 : 2
  if (count(level) >= want[level]) continue

  const g = new Chess(fen0!)
  const [first, solution] = moves!.split(' ')
  try {
    g.move({ from: first!.slice(0, 2), to: first!.slice(2, 4), promotion: first![4] })
  } catch {
    continue
  }
  const flip = g.turn() === 'b'
  const fen = flip ? mirror(g.fen()) : g.fen()
  // تأیید با حل‌کنندهٔ خود بازی: مات در ۱ دقیقاً یک حرکت مات دارد؛
  // در مات در ۲، مات یک‌حرکتی نیست و حرکت اول راه‌حل Lichess در برابر هر دفاعی مات می‌دهد
  if (mateIn === 1 && mateInOneMoves(fen).length !== 1) continue // فقط یک حرکت مات، تا معما یک جواب داشته باشد
  if (mateIn === 2 && (mateInOneMoves(fen).length || !isMateInTwoFirstMove(fen, flip ? mirrorMove(solution!) : solution!))) continue
  pick.push({ fen, mateIn, level, source: `lichess:${id}` })
}

for (const l of [1, 2, 3] as const) console.log(`سطح ${l}: ${count(l)}/${want[l]}`)
writeFileSync(join(import.meta.dirname, '..', 'prisma', 'data', 'chess-puzzles.json'), JSON.stringify(pick) + '\n')
