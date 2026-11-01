// موتور «دوز» (دوزِ نه‌تایی / Nine Men's Morris) و هوش مصنوعی minimax با هرس آلفا-بتا
//
// شماره‌گذاری ۲۴ خانه (سه مربع تودرتو):
//  0-----------1-----------2
//  |   3-------4-------5   |
//  |   |   6---7---8   |   |
//  9--10--11       12--13--14
//  |   |  15--16--17   |   |
//  |  18------19------20   |
//  21----------22----------23

export type Cell = 0 | 1 | 2
export type Player = 1 | 2
export type Rng = () => number
export type Difficulty = 1 | 2 | 3

export const ADJ: number[][] = [
  [1, 9],
  [0, 2, 4],
  [1, 14],
  [4, 10],
  [1, 3, 5, 7],
  [4, 13],
  [7, 11],
  [4, 6, 8],
  [7, 12],
  [0, 10, 21],
  [3, 9, 11, 18],
  [6, 10, 15],
  [8, 13, 17],
  [5, 12, 14, 20],
  [2, 13, 23],
  [11, 16],
  [15, 17, 19],
  [12, 16],
  [10, 19],
  [16, 18, 20, 22],
  [13, 19],
  [9, 22],
  [19, 21, 23],
  [14, 22]
]

export const MILLS: number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [9, 10, 11],
  [12, 13, 14],
  [15, 16, 17],
  [18, 19, 20],
  [21, 22, 23],
  [0, 9, 21],
  [3, 10, 18],
  [6, 11, 15],
  [1, 4, 7],
  [16, 19, 22],
  [8, 12, 17],
  [5, 13, 20],
  [2, 14, 23]
]

/** مختصات شبکهٔ ۷×۷ برای رسم */
export const COORDS: [number, number][] = [
  [0, 0],
  [3, 0],
  [6, 0],
  [1, 1],
  [3, 1],
  [5, 1],
  [2, 2],
  [3, 2],
  [4, 2],
  [0, 3],
  [1, 3],
  [2, 3],
  [4, 3],
  [5, 3],
  [6, 3],
  [2, 4],
  [3, 4],
  [4, 4],
  [1, 5],
  [3, 5],
  [5, 5],
  [0, 6],
  [3, 6],
  [6, 6]
]

const MILLS_OF: number[][] = Array.from({ length: 24 }, (_, i) => MILLS.map((m, k) => (m.includes(i) ? k : -1)).filter((k) => k >= 0))

export const MAX_PLIES = 200 // پس از این تعداد حرکت، مساوی

export interface MorrisState {
  board: Cell[]
  /** مهره‌های هنوز گذاشته‌نشده برای هر بازیکن */
  hand: { 1: number; 2: number }
  turn: Player
  plies: number
}

export interface MorrisMove {
  from?: number
  to: number
  remove?: number
}

export const other = (p: Player): Player => (p === 1 ? 2 : 1)

export function initialState(): MorrisState {
  return { board: Array<Cell>(24).fill(0), hand: { 1: 9, 2: 9 }, turn: 1, plies: 0 }
}

export const onBoard = (s: MorrisState, p: Player) => s.board.filter((c) => c === p).length
export const totalPieces = (s: MorrisState, p: Player) => onBoard(s, p) + s.hand[p]

export function phaseOf(s: MorrisState, p: Player): 'place' | 'move' | 'fly' {
  if (s.hand[p] > 0) return 'place'
  return onBoard(s, p) === 3 ? 'fly' : 'move'
}

/** آیا مهرهٔ خانهٔ i بخشی از یک «دوز» (سه‌تایی) برای بازیکن p است؟ */
export function inMill(board: Cell[], i: number, p: Player): boolean {
  return MILLS_OF[i]!.some((k) => MILLS[k]!.every((j) => board[j] === p))
}

/** مهره‌های حریف که می‌توان برداشت: آن‌هایی که در دوز نیستند، مگر همه در دوز باشند */
export function removable(board: Cell[], victim: Player): number[] {
  const all = board.map((c, i) => (c === victim ? i : -1)).filter((i) => i >= 0)
  const free = all.filter((i) => !inMill(board, i, victim))
  return free.length ? free : all
}

/** همهٔ حرکت‌های مجاز بازیکن نوبت (حرکت‌هایی که دوز می‌سازند با هر انتخاب ممکن برای برداشتن گسترش می‌یابند) */
export function legalMoves(s: MorrisState): MorrisMove[] {
  const p = s.turn
  const phase = phaseOf(s, p)
  const empty = s.board.map((c, i) => (c === 0 ? i : -1)).filter((i) => i >= 0)
  const base: MorrisMove[] = []
  if (phase === 'place') for (const to of empty) base.push({ to })
  else {
    for (let from = 0; from < 24; from++) {
      if (s.board[from] !== p) continue
      const targets = phase === 'fly' ? empty : ADJ[from]!.filter((j) => s.board[j] === 0)
      for (const to of targets) base.push({ from, to })
    }
  }
  const out: MorrisMove[] = []
  for (const m of base) {
    const b = s.board.slice()
    if (m.from !== undefined) b[m.from] = 0
    b[m.to] = p
    if (inMill(b, m.to, p)) {
      const rem = removable(b, other(p))
      if (rem.length) for (const r of rem) out.push({ ...m, remove: r })
      else out.push(m)
    } else out.push(m)
  }
  return out
}

export function applyMove(s: MorrisState, m: MorrisMove): MorrisState {
  const p = s.turn
  const board = s.board.slice()
  const hand = { ...s.hand }
  if (m.from === undefined) hand[p]--
  else board[m.from] = 0
  board[m.to] = p
  if (m.remove !== undefined) board[m.remove] = 0
  return { board, hand, turn: other(p), plies: s.plies + 1 }
}

/** آیا این حرکت (بدون برداشتن) دوز می‌سازد؟ برای رابط کاربری که برداشتن را مرحلهٔ جدا می‌پرسد */
export function makesMill(s: MorrisState, from: number | undefined, to: number): boolean {
  const b = s.board.slice()
  if (from !== undefined) b[from] = 0
  b[to] = s.turn
  return inMill(b, to, s.turn)
}

/** برنده: ۱ یا ۲، «draw» برای مساوی، ۰ اگر بازی ادامه دارد */
export function winner(s: MorrisState): Player | 'draw' | 0 {
  for (const p of [1, 2] as Player[]) if (s.hand[p] === 0 && onBoard(s, p) < 3) return other(p)
  if (legalMoves(s).length === 0) return other(s.turn)
  if (s.plies >= MAX_PLIES) return 'draw'
  return 0
}

/** ارزیابی از دید بازیکن p */
function evaluate(s: MorrisState, p: Player): number {
  const q = other(p)
  const pieces = totalPieces(s, p) - totalPieces(s, q)
  // دوزهای نیمه‌کاره: دو مهرهٔ خودی و یک خانهٔ خالی
  let open = 0
  for (const m of MILLS) {
    const mine = m.filter((i) => s.board[i] === p).length
    const theirs = m.filter((i) => s.board[i] === q).length
    const empty = m.filter((i) => s.board[i] === 0).length
    if (mine === 2 && empty === 1) open++
    if (theirs === 2 && empty === 1) open--
  }
  let mobility = 0
  if (s.hand[p] === 0 && s.hand[q] === 0) {
    const mob = (pl: Player) => legalMoves({ ...s, turn: pl }).length
    mobility = mob(p) - mob(q)
  }
  return pieces * 100 + open * 12 + mobility * 2
}

function negamax(s: MorrisState, depth: number, alpha: number, beta: number, p: Player): number {
  const w = winner(s)
  if (w === p) return 100_000 + depth
  if (w === other(p)) return -100_000 - depth
  if (w === 'draw') return 0
  if (depth === 0) return evaluate(s, p)
  const moves = legalMoves(s)
  // ترتیب حرکت: حرکت‌های دوزساز اول (هرس بهتر)
  moves.sort((a, b) => (b.remove !== undefined ? 1 : 0) - (a.remove !== undefined ? 1 : 0))
  let best = -Infinity
  for (const m of moves) {
    const v = -negamax(applyMove(s, m), depth - 1, -beta, -alpha, other(p))
    if (v > best) best = v
    if (v > alpha) alpha = v
    if (alpha >= beta) break
  }
  return best
}

export const AI_DEPTH: Record<Difficulty, number> = { 1: 1, 2: 2, 3: 4 }

/** بهترین حرکت برای بازیکن نوبت. سختی آسان گاهی حرکت تصادفی می‌کند */
export function bestMove(s: MorrisState, difficulty: Difficulty, rng: Rng = Math.random): MorrisMove {
  const moves = legalMoves(s)
  if (difficulty === 1 && rng() < 0.35) return moves[Math.floor(rng() * moves.length)]!
  // در مرحلهٔ چیدن عمق ۴ گران است؛ یک واحد کمترش می‌کنیم
  const depth = difficulty === 3 && (s.hand[1] > 0 || s.hand[2] > 0) ? 3 : AI_DEPTH[difficulty]
  let bestV = -Infinity
  let best: MorrisMove[] = []
  for (const m of moves) {
    const v = -negamax(applyMove(s, m), depth - 1, -Infinity, Infinity, other(s.turn))
    if (v > bestV) {
      bestV = v
      best = [m]
    } else if (v === bestV) best.push(m)
  }
  return best[Math.floor(rng() * best.length)]!
}

/** امتیاز: برد → ۱۰۰ × سختی + ۱۰ برای هر مهرهٔ باقی‌مانده · مساوی → ۳۰ × سختی · باخت → ۵ برای هر مهرهٔ گرفته‌شده */
export function morrisScore(result: 'win' | 'draw' | 'loss', difficulty: Difficulty, ownLeft: number, captured: number) {
  if (result === 'win') return 100 * difficulty + 10 * ownLeft
  if (result === 'draw') return 30 * difficulty
  return 5 * captured
}
