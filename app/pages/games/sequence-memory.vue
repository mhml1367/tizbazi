<script setup lang="ts">
import { fa } from '~/i18n/fa'
import {
  SM_GAP_MS,
  SM_ROUNDS,
  SM_RULES,
  extendSequence,
  initialSequence,
  isClickCorrect,
  roundScore
} from '~~/shared/games/sequence-memory'

const { phase, difficulty, count, saveState, reward, setDifficulty, countdown, finish } = useGameFlow('sequence-memory')

const sub = ref<'show' | 'input' | 'between'>('show')
const seq = ref<number[]>([])
const round = ref(1)
const clicks = ref(0)
const lit = ref(-1)
const score = ref(0)
const completed = ref(0)
const failed = ref(false)
const flashCell = ref<{ i: number; ok: boolean } | null>(null)

let gameStart = 0
let runId = 0
onBeforeUnmount(() => runId++)

const grid = computed(() => SM_RULES[difficulty.value].grid)
const cells = computed(() => grid.value ** 2)
const accuracy = computed(() => {
  const attempts = completed.value + (failed.value ? 1 : 0)
  return attempts ? Math.round((completed.value / attempts) * 1000) / 10 : 0
})
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function start() {
  score.value = completed.value = 0
  failed.value = false
  round.value = 1
  countdown(() => {
    gameStart = Date.now()
    seq.value = initialSequence(cells.value)
    play()
  })
}

async function play() {
  const my = ++runId
  sub.value = 'show'
  clicks.value = 0
  await sleep(500)
  for (const c of seq.value) {
    if (my !== runId) return
    lit.value = c
    await sleep(SM_RULES[difficulty.value].showMs)
    lit.value = -1
    await sleep(SM_GAP_MS)
  }
  if (my === runId) sub.value = 'input'
}

async function click(i: number) {
  if (phase.value !== 'playing' || sub.value !== 'input') return
  const ok = isClickCorrect(seq.value, clicks.value, i)
  flashCell.value = { i, ok }
  setTimeout(() => (flashCell.value = null), 250)
  if (!ok) {
    failed.value = true
    return end()
  }
  if (++clicks.value < seq.value.length) return
  score.value += roundScore(round.value)
  completed.value++
  if (round.value >= SM_ROUNDS) return end()
  sub.value = 'between'
  round.value++
  seq.value = extendSequence(seq.value, cells.value)
  await sleep(700)
  play()
}

function end() {
  runId++
  finish({ rawScore: score.value, accuracy: accuracy.value, duration: Date.now() - gameStart })
}
</script>

<template>
  <div class="wrap">
    <GameIntro
      v-if="phase === 'idle'"
      :name="fa.games['sequence-memory']!.name"
      :desc="fa.games['sequence-memory']!.desc"
      :difficulty="difficulty"
      @difficulty="setDifficulty"
      @start="start"
    />

    <div v-else-if="phase === 'countdown'" class="card pad count">{{ toFa(count) }}</div>

    <div v-else-if="phase === 'playing'" class="card pad">
      <GameHud :score="score" :progress="`${fa.common.stage} ${toFa(round)}/${toFa(SM_ROUNDS)}`" />
      <p class="status">
        {{ sub === 'show' ? fa.games['sequence-memory']!.watch : sub === 'input' ? fa.games['sequence-memory']!.repeat : '✓' }}
      </p>
      <div class="grid" :style="{ gridTemplateColumns: `repeat(${grid}, 1fr)` }">
        <button
          v-for="i in cells"
          :key="i"
          class="cell"
          :class="{ lit: lit === i - 1, ok: flashCell?.i === i - 1 && flashCell.ok, bad: flashCell?.i === i - 1 && !flashCell.ok }"
          :disabled="sub !== 'input'"
          :aria-label="`خانه ${toFa(i)}`"
          @click="click(i - 1)"
        >
          {{ toFa(i) }}
        </button>
      </div>
    </div>

    <GameResult
      v-else
      :score="score"
      :accuracy="accuracy"
      :save-state="saveState"
      :reward="reward"
      :good="100"
      :great="300"
      @again="start"
    />
  </div>
</template>

<style scoped>
.wrap {
  max-width: 520px;
  margin-inline: auto;
}
.pad {
  padding: var(--sp-5);
  text-align: center;
}
.count {
  font-size: 96px;
  font-weight: 900;
  color: var(--accent);
}
.status {
  color: var(--text-mid);
  min-height: 28px;
}
.grid {
  display: grid;
  gap: var(--sp-2);
}
.cell {
  aspect-ratio: 1;
  min-height: 44px;
  border-radius: var(--r-md);
  border: 1px solid var(--line);
  background: var(--surface-hi);
  color: var(--text-mid);
  font-weight: 800;
  font-size: clamp(14px, 4vw, 22px);
  transition:
    background 120ms var(--ease),
    transform 120ms var(--ease);
}
.cell:disabled {
  cursor: default;
}
.cell.lit {
  background: var(--accent);
  color: var(--on-accent);
  transform: scale(1.06);
}
.cell.ok {
  background: var(--success);
  color: var(--on-accent);
}
.cell.bad {
  background: var(--danger);
  color: var(--on-accent);
}
</style>
