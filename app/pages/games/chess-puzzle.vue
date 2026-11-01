<script setup lang="ts">
import { Chess, type Square } from 'chess.js'
import { fa } from '~/i18n/fa'
import {
  CP,
  bestDefence,
  isMateInTwoFirstMove,
  mateInOneMoves,
  mateInTwoFirstMoves,
  puzzleScore,
  type ChessPuzzle
} from '~~/shared/games/chess'

const { phase, difficulty, count, saveState, reward, setDifficulty, countdown, finish } = useGameFlow('chess-puzzle')
const T = fa.games['chess-puzzle']!

const puzzles = ref<ChessPuzzle[]>([])
const idx = ref(0)
const fen = ref('')
const stage = ref<1 | 2>(1) // در مات دوحرکتی: ۱ = حرکت اول، ۲ = حرکت مات
const selected = ref<Square | null>(null)
const message = ref('')
const highlight = ref<string[]>([]) // خانه‌های راه‌حل یا آخرین حرکت
const locked = ref(false)
const score = ref(0)
const solved = ref(0)
const timeLeft = ref(0)
const loadError = ref('')

let puzzleStart = 0
let started = 0
let ticker: ReturnType<typeof setInterval> | undefined
onBeforeUnmount(() => clearInterval(ticker))

const puzzle = computed(() => puzzles.value[idx.value])
const seconds = computed(() => CP.seconds[difficulty.value])
const game = computed(() => (fen.value ? new Chess(fen.value) : null))
const accuracy = computed(() => (puzzles.value.length ? Math.round((solved.value / puzzles.value.length) * 1000) / 10 : 0))

const FILES = 'abcdefgh'
/** خانه‌ها از دید سفید: ردیف ۸ بالا */
const squares = computed(() => {
  const out: { sq: Square; dark: boolean }[] = []
  for (let r = 7; r >= 0; r--) for (let f = 0; f < 8; f++) out.push({ sq: `${FILES[f]}${r + 1}` as Square, dark: (r + f) % 2 === 0 })
  return out
})
const GLYPH: Record<string, string> = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' }
const pieceAt = (sq: Square) => game.value?.get(sq)
const targets = computed(() =>
  selected.value && game.value ? game.value.moves({ square: selected.value, verbose: true }).map((m) => m.to as string) : []
)

async function start() {
  loadError.value = ''
  try {
    puzzles.value = (
      await $fetch<{ rounds: ChessPuzzle[] }>('/api/games/rounds/chess-puzzle', { query: { difficulty: difficulty.value } })
    ).rounds
  } catch (e: any) {
    loadError.value = e?.data?.statusMessage || 'بارگذاری بازی انجام نشد'
    return
  }
  idx.value = 0
  score.value = solved.value = 0
  countdown(() => {
    started = Date.now()
    load()
    ticker = setInterval(() => {
      if (locked.value) return
      timeLeft.value = Math.max(0, seconds.value - (Date.now() - puzzleStart) / 1000)
      if (timeLeft.value <= 0) fail()
    }, 250)
  })
}

function load() {
  fen.value = puzzle.value!.fen
  stage.value = 1
  selected.value = null
  highlight.value = []
  message.value = puzzle.value!.mateIn === 1 ? T.mate1! : T.mate2!
  locked.value = false
  puzzleStart = Date.now()
  timeLeft.value = seconds.value
}

function click(sq: Square) {
  if (phase.value !== 'playing' || locked.value || !game.value) return
  const p = pieceAt(sq)
  if (p && p.color === 'w') {
    selected.value = selected.value === sq ? null : sq
    return
  }
  if (selected.value && targets.value.includes(sq)) tryMove(`${selected.value}${sq}`)
}

function tryMove(base: string) {
  const g = new Chess(fen.value)
  // ارتقای پیاده همیشه به وزیر
  const piece = g.get(base.slice(0, 2) as Square)
  const promo = piece?.type === 'p' && base[3] === '8' ? 'q' : ''
  const move = base + promo
  selected.value = null

  const isFirstOfTwo = puzzle.value!.mateIn === 2 && stage.value === 1
  const ok = isFirstOfTwo ? isMateInTwoFirstMove(fen.value, move) : mateInOneMoves(fen.value).includes(move)
  if (!ok) return fail()

  g.move({ from: move.slice(0, 2), to: move.slice(2, 4), promotion: move[4] })
  fen.value = g.fen()
  highlight.value = [move.slice(0, 2), move.slice(2, 4)]
  if (g.isCheckmate()) return succeed()

  // مات دوحرکتی: سیاه بهترین دفاع را بازی می‌کند و نوبت حرکت مات است
  locked.value = true
  setTimeout(() => {
    const d = bestDefence(fen.value)!
    const g2 = new Chess(fen.value)
    g2.move({ from: d.slice(0, 2), to: d.slice(2, 4), promotion: d[4] })
    fen.value = g2.fen()
    highlight.value = [d.slice(0, 2), d.slice(2, 4)]
    stage.value = 2
    message.value = T.reply!
    locked.value = false
  }, 600)
}

function succeed() {
  locked.value = true
  solved.value++
  score.value += puzzleScore(true, puzzle.value!.mateIn, timeLeft.value)
  message.value = T.solved!
  setTimeout(next, 1200)
}

function fail() {
  if (locked.value) return
  locked.value = true
  const sol = stage.value === 1 && puzzle.value!.mateIn === 2 ? mateInTwoFirstMoves(fen.value)[0] : mateInOneMoves(fen.value)[0]
  highlight.value = sol ? [sol.slice(0, 2), sol.slice(2, 4)] : []
  message.value = T.wrong!
  setTimeout(next, 2200)
}

function next() {
  if (idx.value + 1 >= puzzles.value.length) {
    clearInterval(ticker)
    finish({ rawScore: score.value, accuracy: accuracy.value, duration: Date.now() - started })
    return
  }
  idx.value++
  load()
}
</script>

<template>
  <div class="game-wrap">
    <GameIntro
      v-if="phase === 'idle'"
      :name="T.name"
      :desc="T.desc"
      :difficulty="difficulty"
      :error="loadError"
      @difficulty="setDifficulty"
      @start="start"
    />

    <div v-else-if="phase === 'countdown'" class="card game-pad game-count">{{ toFa(count) }}</div>

    <div v-else-if="phase === 'playing' && puzzle" class="card game-pad">
      <GameHud :score="score" :progress="`${toFa(idx + 1)}/${toFa(puzzles.length)}`" :time="timeLeft" />
      <GameTimer :left="timeLeft" :total="seconds" />
      <p class="msg" aria-live="polite">{{ message }}</p>

      <div class="board" dir="ltr" role="grid" aria-label="صفحهٔ شطرنج">
        <button
          v-for="c in squares"
          :key="c.sq"
          class="sq"
          :class="{ dark: c.dark, sel: selected === c.sq, tgt: targets.includes(c.sq), hl: highlight.includes(c.sq) }"
          :aria-label="c.sq"
          @click="click(c.sq)"
        >
          <span v-if="pieceAt(c.sq)" class="pc" :class="pieceAt(c.sq)!.color">{{ GLYPH[pieceAt(c.sq)!.type] }}</span>
        </button>
      </div>
    </div>

    <GameResult
      v-else
      :score="score"
      :accuracy="accuracy"
      :save-state="saveState"
      :reward="reward"
      :good="60"
      :great="120"
      @again="start"
    />
  </div>
</template>

<style scoped>
.msg {
  font-weight: 800;
  color: var(--text-hi);
  min-height: 32px;
}
.board {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  width: 100%;
  max-width: 480px;
  margin: var(--sp-3) auto 0;
  border: 3px solid oklch(35% 0.04 60);
  border-radius: var(--r-sm);
  overflow: hidden;
}
.sq {
  aspect-ratio: 1;
  border: none;
  padding: 0;
  background: oklch(88% 0.04 85);
  display: grid;
  place-items: center;
  position: relative;
}
.sq.dark {
  background: oklch(62% 0.07 60);
}
.sq.hl {
  box-shadow: inset 0 0 0 100px oklch(80% 0.15 95 / 0.55);
}
.sq.sel {
  box-shadow: inset 0 0 0 4px var(--accent);
}
.sq.tgt::after {
  content: '';
  width: 28%;
  height: 28%;
  border-radius: 50%;
  background: oklch(40% 0.1 170 / 0.55);
  position: absolute;
}
.pc {
  font-size: clamp(26px, 8vw, 44px);
  line-height: 1;
  pointer-events: none;
}
.pc.w {
  color: oklch(98% 0.01 85);
  text-shadow:
    0 0 2px oklch(10% 0 0),
    0 0 1px oklch(10% 0 0);
}
.pc.b {
  color: oklch(15% 0.02 250);
}
</style>
