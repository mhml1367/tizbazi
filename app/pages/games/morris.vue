<script setup lang="ts">
import { fa } from '~/i18n/fa'
import {
  ADJ,
  COORDS,
  applyMove,
  bestMove,
  initialState,
  makesMill,
  morrisScore,
  onBoard,
  phaseOf,
  removable,
  totalPieces,
  winner,
  type Cell,
  type MorrisState
} from '~~/shared/games/morris'

const { phase, difficulty, count, saveState, reward, setDifficulty, countdown, finish } = useGameFlow('morris')
const T = fa.games.morris!

// بازیکن ۱ = تو (مهره‌های روشن)، بازیکن ۲ = رایانه (مهره‌های تیره)
const s = ref<MorrisState>(initialState())
const selected = ref<number | null>(null)
/** دوز ساخته شده و منتظر انتخاب مهرهٔ حریف برای برداشتن */
const pending = ref<{ from?: number; to: number } | null>(null)
const thinking = ref(false)
const result = ref<'win' | 'loss' | 'draw' | null>(null)
const lastAi = ref<number[]>([])
let started = 0

const S = 60 // فاصلهٔ خانه‌ها در SVG
const xy = (i: number) => [30 + COORDS[i]![0] * S, 30 + COORDS[i]![1] * S] as const
const lines = computed(() => {
  const out: [number, number][] = []
  ADJ.forEach((ns, i) => ns.forEach((j) => i < j && out.push([i, j])))
  return out
})

/** صفحه با حرکت موقت (پیش از برداشتن مهرهٔ حریف) */
const view = computed<Cell[]>(() => {
  const b = s.value.board.slice()
  if (pending.value) {
    if (pending.value.from !== undefined) b[pending.value.from] = 0
    b[pending.value.to] = 1
  }
  return b
})
const removableNow = computed(() => (pending.value ? removable(view.value, 2) : []))
const myPhase = computed(() => phaseOf(s.value, 1))
const status = computed(() => {
  if (thinking.value) return T.thinking
  if (pending.value) return T.remove
  return myPhase.value === 'place' ? T.place : myPhase.value === 'fly' ? T.fly : T.move
})
/** خانه‌های مقصد مجاز برای مهرهٔ انتخاب‌شده */
const targets = computed(() => {
  if (selected.value === null) return []
  const empty = s.value.board.map((c, i) => (c === 0 ? i : -1)).filter((i) => i >= 0)
  return myPhase.value === 'fly' ? empty : ADJ[selected.value]!.filter((j) => s.value.board[j] === 0)
})

function start() {
  s.value = initialState()
  selected.value = null
  pending.value = null
  result.value = null
  lastAi.value = []
  countdown(() => (started = Date.now()))
}

function commit(move: { from?: number; to: number; remove?: number }) {
  s.value = applyMove(s.value, move)
  selected.value = null
  pending.value = null
  if (!checkEnd()) aiTurn()
}

function click(i: number) {
  if (phase.value !== 'playing' || thinking.value || s.value.turn !== 1) return
  // انتخاب مهرهٔ حریف برای برداشتن
  if (pending.value) {
    if (removableNow.value.includes(i)) commit({ ...pending.value, remove: i })
    return
  }
  const p = myPhase.value
  if (p === 'place') {
    if (s.value.board[i] !== 0) return
    if (makesMill(s.value, undefined, i) && onBoard(s.value, 2) > 0) pending.value = { to: i }
    else commit({ to: i })
    return
  }
  if (s.value.board[i] === 1) {
    selected.value = selected.value === i ? null : i
    return
  }
  if (selected.value !== null && targets.value.includes(i)) {
    const from = selected.value
    if (makesMill(s.value, from, i) && onBoard(s.value, 2) > 0) pending.value = { from, to: i }
    else commit({ from, to: i })
  }
}

function aiTurn() {
  thinking.value = true
  // اجازه بده رابط کاربری پیش از محاسبهٔ سنگین به‌روز شود
  setTimeout(() => {
    const m = bestMove(s.value, difficulty.value)
    lastAi.value = [m.from, m.to, m.remove].filter((x): x is number => x !== undefined)
    s.value = applyMove(s.value, m)
    thinking.value = false
    checkEnd()
  }, 350)
}

function checkEnd(): boolean {
  const w = winner(s.value)
  if (!w) return false
  result.value = w === 'draw' ? 'draw' : w === 1 ? 'win' : 'loss'
  const captured = 9 - totalPieces(s.value, 2)
  finish({
    rawScore: morrisScore(result.value, difficulty.value, totalPieces(s.value, 1), captured),
    accuracy: result.value === 'win' ? 100 : Math.round((captured / 7) * 1000) / 10,
    duration: Date.now() - started
  })
  return true
}

const finalScore = computed(() =>
  result.value ? morrisScore(result.value, difficulty.value, totalPieces(s.value, 1), 9 - totalPieces(s.value, 2)) : 0
)
</script>

<template>
  <div class="game-wrap">
    <GameIntro v-if="phase === 'idle'" :name="T.name" :desc="T.desc" :difficulty="difficulty" @difficulty="setDifficulty" @start="start" />

    <div v-else-if="phase === 'countdown'" class="card game-pad game-count">{{ toFa(count) }}</div>

    <div v-else-if="phase === 'playing'" class="card game-pad">
      <div class="players">
        <span class="pl me"
          >⚪ {{ T.you }} · {{ T.inHand }} {{ toFa(s.hand[1]) }} · {{ T.captured }} {{ toFa(9 - totalPieces(s, 2)) }}</span
        >
        <span class="pl ai">⚫ {{ T.ai }} · {{ T.inHand }} {{ toFa(s.hand[2]) }}</span>
      </div>
      <p class="status" :class="{ alert: pending }" aria-live="polite">{{ status }}</p>

      <svg viewBox="0 0 420 420" class="board" dir="ltr" role="img" aria-label="صفحهٔ دوز">
        <line v-for="([a, b], k) in lines" :key="k" :x1="xy(a)[0]" :y1="xy(a)[1]" :x2="xy(b)[0]" :y2="xy(b)[1]" class="ln" />
        <g v-for="i in 24" :key="i" class="pt" @click="click(i - 1)">
          <circle :cx="xy(i - 1)[0]" :cy="xy(i - 1)[1]" r="24" class="hit" />
          <circle :cx="xy(i - 1)[0]" :cy="xy(i - 1)[1]" r="7" class="spot" :class="{ target: targets.includes(i - 1) }" />
          <circle
            v-if="view[i - 1]"
            :cx="xy(i - 1)[0]"
            :cy="xy(i - 1)[1]"
            r="18"
            class="piece"
            :class="[
              view[i - 1] === 1 ? 'p1' : 'p2',
              { sel: selected === i - 1, rem: removableNow.includes(i - 1), last: lastAi.includes(i - 1) }
            ]"
          />
        </g>
      </svg>
    </div>

    <div v-else>
      <p class="card game-pad verdict">{{ result ? T[result] : '' }}</p>
      <GameResult
        :score="finalScore"
        :accuracy="result === 'win' ? 100 : 0"
        :save-state="saveState"
        :reward="reward"
        :good="50"
        :great="150"
        @again="start"
      />
    </div>
  </div>
</template>

<style scoped>
.players {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--sp-2);
  font-size: 14px;
  color: var(--text-mid);
}
.status {
  font-weight: 800;
  color: var(--text-hi);
  min-height: 32px;
}
.status.alert {
  color: var(--danger);
}
.board {
  width: 100%;
  max-width: 440px;
  touch-action: manipulation;
}
.ln {
  stroke: var(--text-mid);
  stroke-width: 3;
}
.pt {
  cursor: pointer;
}
.hit {
  fill: transparent;
}
.spot {
  fill: var(--text-mid);
}
.spot.target {
  fill: var(--accent);
  r: 11;
}
.piece {
  stroke-width: 3;
  transition: r 150ms var(--ease);
}
.piece.p1 {
  fill: oklch(97% 0.01 85);
  stroke: oklch(45% 0.02 250);
}
/* مهرهٔ تیره با حاشیهٔ روشن تا در تم تیره هم دیده شود */
.piece.p2 {
  fill: oklch(28% 0.03 250);
  stroke: oklch(80% 0.02 250);
}
.piece.sel {
  stroke: var(--accent);
  stroke-width: 6;
}
.piece.rem {
  stroke: var(--danger);
  stroke-width: 6;
  stroke-dasharray: 6 4;
}
.piece.last {
  stroke: var(--c-orange);
  stroke-width: 5;
}
.verdict {
  font-size: 24px;
  font-weight: 900;
  color: var(--text-hi);
  margin-bottom: var(--sp-3);
}
</style>
