// منطق «کاشی‌کاری»: جفت‌یابی کاشی‌های با نقش ایرانی
export type Rng = () => number
export type Difficulty = 1 | 2 | 3

export const TILE_SHAPES = ['star8', 'star6', 'rosette', 'girih', 'diamond', 'flower', 'khatam', 'sun'] as const
export type TileShape = (typeof TILE_SHAPES)[number]
/** رنگ‌های سنتی کاشی: فیروزه‌ای، لاجوردی، زعفرانی، لاکی، سبز سیر، اخرایی */
export const TILE_COLORS = ['#1a9fa0', '#2c4f9e', '#e0a422', '#b8323b', '#2f7d4f', '#b8662f'] as const

export interface TileFace {
  shape: TileShape
  color: number
}
export interface TileCard {
  id: number
  face: TileFace
}

export const TL_RULES: Record<Difficulty, { pairs: number; cols: number; seconds: number }> = {
  1: { pairs: 6, cols: 4, seconds: 90 },
  2: { pairs: 8, cols: 4, seconds: 120 },
  3: { pairs: 12, cols: 6, seconds: 180 }
}

const shuffle = <T>(a: readonly T[], rng: Rng): T[] => {
  const r = [...a]
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[r[i], r[j]] = [r[j]!, r[i]!]
  }
  return r
}

/**
 * دستهٔ کارت‌ها. در سختی بالا نقش‌ها عمداً شبیه‌اند: فقط ۳ شکل با ۴ رنگ،
 * پس هر کاشی چند «همزاد» دارد که فقط در رنگ یا فقط در شکل فرق می‌کنند.
 */
export function buildDeck(difficulty: Difficulty, rng: Rng = Math.random): TileCard[] {
  const { pairs } = TL_RULES[difficulty]
  let faces: TileFace[]
  if (difficulty === 3) {
    const shapes = shuffle(TILE_SHAPES, rng).slice(0, 3)
    const colors = shuffle([0, 1, 2, 3, 4, 5], rng).slice(0, 4)
    faces = shapes.flatMap((shape) => colors.map((color) => ({ shape, color })))
  } else {
    const all = TILE_SHAPES.flatMap((shape) => TILE_COLORS.map((_, color) => ({ shape, color })))
    // در آسان شکل‌ها تکراری نیستند تا تشخیص راحت باشد
    faces =
      difficulty === 1
        ? shuffle(TILE_SHAPES, rng)
            .slice(0, pairs)
            .map((shape) => ({ shape, color: Math.floor(rng() * TILE_COLORS.length) }))
        : shuffle(all, rng).slice(0, pairs)
  }
  return shuffle(
    faces.slice(0, pairs).flatMap((f) => [f, f]),
    rng
  ).map((face, id) => ({ id, face }))
}

export const sameFace = (a: TileFace, b: TileFace) => a.shape === b.shape && a.color === b.color

/** امتیاز: ۲۰ برای هر جفت − ۳ برای هر تلاش ناموفق (حداقل ۰) + نصف ثانیه‌های باقی‌مانده اگر همه پیدا شده باشند */
export function tileScore(pairsFound: number, misses: number, secondsLeft: number, complete: boolean) {
  return Math.max(0, pairsFound * 20 - misses * 3) + (complete ? Math.floor(Math.max(0, secondsLeft) / 2) : 0)
}
