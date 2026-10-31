// منطق «حافظه ترتیبی»: دنباله روی جدول نمایش داده می‌شود و کاربر باید همان را تکرار کند

export type Rng = () => number
export type Difficulty = 1 | 2 | 3

export const SM_RULES: Record<Difficulty, { grid: number; showMs: number }> = {
  1: { grid: 3, showMs: 1000 },
  2: { grid: 4, showMs: 700 },
  3: { grid: 5, showMs: 500 }
}
export const SM_GAP_MS = 200
export const SM_START_LENGTH = 3
export const SM_MAX_LENGTH = 12
export const SM_ROUNDS = SM_MAX_LENGTH - SM_START_LENGTH + 1

/** طول دنباله در مرحلهٔ r (از ۱): ۳ تا ۱۲ */
export const lengthForRound = (round: number) => SM_START_LENGTH + round - 1

/** دنبالهٔ اولیه: خانهٔ پشت‌سرهم تکراری نمی‌آید */
export function extendSequence(prev: number[], cells: number, rng: Rng = Math.random): number[] {
  const seq = [...prev]
  while (seq.length < 1) seq.push(Math.floor(rng() * cells))
  return [...seq, nextCell(seq[seq.length - 1]!, cells, rng)]
}

function nextCell(last: number, cells: number, rng: Rng) {
  const n = Math.floor(rng() * (cells - 1))
  return n >= last ? n + 1 : n
}

export function initialSequence(cells: number, rng: Rng = Math.random): number[] {
  let seq = [Math.floor(rng() * cells)]
  while (seq.length < SM_START_LENGTH) seq = [...seq, nextCell(seq[seq.length - 1]!, cells, rng)]
  return seq
}

/** آیا کلیک شمارهٔ i (از ۰) با دنباله می‌خواند */
export const isClickCorrect = (seq: number[], i: number, cell: number) => seq[i] === cell

/** هر مرحلهٔ کامل: شمارهٔ مرحله × ۱۰ */
export const roundScore = (round: number) => round * 10
