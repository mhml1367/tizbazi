<script setup lang="ts">
import { fa } from '~/i18n/fa'
import { TL_RULES, buildDeck, sameFace, tileScore, type TileCard } from '~~/shared/games/tiles'

const { phase, difficulty, count, saveState, reward, setDifficulty, countdown, finish } = useGameFlow('tile-memory')
const T = fa.games['tile-memory']!

const deck = ref<TileCard[]>([])
const open = ref<number[]>([]) // اندیس کارت‌های رو شده (حداکثر ۲)
const matched = ref<Set<number>>(new Set())
const misses = ref(0)
const attempts = ref(0)
const timeLeft = ref(0)
let lock = false
let started = 0
let ticker: ReturnType<typeof setInterval> | undefined
onBeforeUnmount(() => clearInterval(ticker))

const rules = computed(() => TL_RULES[difficulty.value])
const pairs = computed(() => matched.value.size / 2)
const score = computed(() => tileScore(pairs.value, misses.value, timeLeft.value, pairs.value === rules.value.pairs))
const accuracy = computed(() => (attempts.value ? Math.round((pairs.value / attempts.value) * 1000) / 10 : 0))

function start() {
  deck.value = buildDeck(difficulty.value)
  open.value = []
  matched.value = new Set()
  misses.value = attempts.value = 0
  timeLeft.value = rules.value.seconds
  countdown(() => {
    started = Date.now()
    ticker = setInterval(() => {
      timeLeft.value = Math.max(0, rules.value.seconds - Math.floor((Date.now() - started) / 1000))
      if (timeLeft.value <= 0) end()
    }, 250)
  })
}

function flip(i: number) {
  if (phase.value !== 'playing' || lock || open.value.includes(i) || matched.value.has(i)) return
  open.value = [...open.value, i]
  if (open.value.length < 2) return
  attempts.value++
  const [a, b] = open.value as [number, number]
  if (sameFace(deck.value[a]!.face, deck.value[b]!.face)) {
    matched.value = new Set([...matched.value, a, b])
    open.value = []
    if (matched.value.size === deck.value.length) end()
  } else {
    misses.value++
    lock = true
    setTimeout(() => {
      open.value = []
      lock = false
    }, 750)
  }
}

function end() {
  if (phase.value !== 'playing') return
  clearInterval(ticker)
  finish({
    rawScore: score.value,
    accuracy: accuracy.value,
    duration: Date.now() - started
  })
}
</script>

<template>
  <div class="game-wrap wide">
    <GameIntro v-if="phase === 'idle'" :name="T.name" :desc="T.desc" :difficulty="difficulty" @difficulty="setDifficulty" @start="start" />

    <div v-else-if="phase === 'countdown'" class="card game-pad game-count">{{ toFa(count) }}</div>

    <div v-else-if="phase === 'playing'" class="card game-pad">
      <GameHud
        :score="score"
        :progress="`${T.pairs}: ${toFa(pairs)}/${toFa(rules.pairs)} · ${T.misses}: ${toFa(misses)}`"
        :time="timeLeft"
      />
      <div class="board" :style="{ gridTemplateColumns: `repeat(${rules.cols}, 1fr)` }">
        <button
          v-for="(c, i) in deck"
          :key="c.id"
          class="card-btn"
          :class="{ up: open.includes(i) || matched.has(i), done: matched.has(i) }"
          :aria-label="open.includes(i) || matched.has(i) ? `کاشی ${c.face.shape}` : 'کاشی پشت‌ورو'"
          @click="flip(i)"
        >
          <span class="inner">
            <span class="back" />
            <span class="front"><TilePattern :shape="c.face.shape" :color="c.face.color" /></span>
          </span>
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
      :great="200"
      @again="start"
    />
  </div>
</template>

<style scoped>
.wide {
  max-width: 720px;
}
.board {
  display: grid;
  gap: var(--sp-2);
  margin-top: var(--sp-4);
}
.card-btn {
  aspect-ratio: 1;
  min-height: 44px;
  padding: 0;
  border: none;
  background: none;
  perspective: 600px;
}
.inner {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  transition: transform 300ms var(--ease);
  transform-style: preserve-3d;
}
.card-btn.up .inner {
  transform: rotateY(180deg);
}
.back,
.front {
  position: absolute;
  inset: 0;
  border-radius: var(--r-md);
  backface-visibility: hidden;
  overflow: hidden;
}
.back {
  background: repeating-linear-gradient(45deg, var(--accent) 0 6px, transparent 6px 12px), var(--surface-hi);
  border: 2px solid var(--accent);
  opacity: 0.85;
}
.front {
  transform: rotateY(180deg);
  border: 2px solid var(--line);
}
.card-btn.done .front {
  border-color: var(--success);
  opacity: 0.75;
}
@media (prefers-reduced-motion: reduce) {
  .inner {
    transition: none;
  }
}
</style>
