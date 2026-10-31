<script setup lang="ts">
import { fa } from '~/i18n/fa'
import {
  STROOP_COLORS,
  STROOP_DIRS,
  STROOP_LIMITS,
  computeAccuracy,
  computeScore,
  generateQuestion,
  isCorrect,
  type ColorKey,
  type DirKey,
  type StroopQuestion
} from '~~/shared/games/stroop'

const { phase, difficulty, count, saveState, reward, setDifficulty, countdown, finish } = useGameFlow('stroop')

const q = ref<StroopQuestion | null>(null)
const given = reactive<{ color?: ColorKey; direction?: DirKey }>({})
const correct = ref(0)
const wrong = ref(0)
const asked = ref(0)
const timeLeft = ref(STROOP_LIMITS.seconds)
const fastest = ref<number | undefined>()
const flash = ref<'good' | 'bad' | ''>('')

let qStart = 0
let startedAt = 0
let ticker: ReturnType<typeof setInterval> | undefined
onBeforeUnmount(() => clearInterval(ticker))

const score = computed(() => computeScore(correct.value, wrong.value))
const accuracy = computed(() => computeAccuracy(correct.value, wrong.value))
const labelOf = (k: ColorKey) => STROOP_COLORS.find((c) => c.key === k)!.label
const dirLabel = (k: DirKey) => STROOP_DIRS.find((d) => d.key === k)!
const palette = computed(() => (difficulty.value === 1 ? STROOP_COLORS.slice(0, 4) : STROOP_COLORS))
const hint = computed(() =>
  q.value?.kind === 'color'
    ? fa.games.stroop!.askColor
    : q.value?.kind === 'direction'
      ? fa.games.stroop!.askDirection
      : fa.games.stroop!.askBoth
)

function start() {
  correct.value = wrong.value = asked.value = 0
  fastest.value = undefined
  timeLeft.value = STROOP_LIMITS.seconds
  countdown(() => {
    startedAt = Date.now()
    next()
    ticker = setInterval(() => {
      timeLeft.value = Math.max(0, STROOP_LIMITS.seconds - Math.floor((Date.now() - startedAt) / 1000))
      if (timeLeft.value <= 0) end()
    }, 200)
  })
}

function next() {
  if (asked.value >= STROOP_LIMITS.questions) return end()
  asked.value++
  q.value = generateQuestion(difficulty.value)
  given.color = given.direction = undefined
  qStart = Date.now()
}

function pick(part: 'color' | 'direction', key: ColorKey | DirKey) {
  if (phase.value !== 'playing' || !q.value) return
  if (part === 'color') given.color = key as ColorKey
  else given.direction = key as DirKey
  // پاسخ وقتی کامل است که همهٔ ابعاد پرسیده‌شده انتخاب شده باشند
  if ((q.value.answer.color !== undefined && !given.color) || (q.value.answer.direction !== undefined && !given.direction)) return

  const ok = isCorrect(q.value, given)
  if (ok) {
    correct.value++
    const ms = Date.now() - qStart
    if (fastest.value === undefined || ms < fastest.value) fastest.value = ms
  } else wrong.value++
  flash.value = ok ? 'good' : 'bad'
  setTimeout(() => (flash.value = ''), 250)
  next()
}

function end() {
  if (phase.value === 'done') return
  clearInterval(ticker)
  finish({ rawScore: score.value, accuracy: accuracy.value, duration: Date.now() - startedAt, fastestCorrectMs: fastest.value })
}
</script>

<template>
  <div class="wrap">
    <GameIntro
      v-if="phase === 'idle'"
      :name="fa.games.stroop!.name"
      :desc="fa.games.stroop!.desc"
      :difficulty="difficulty"
      @difficulty="setDifficulty"
      @start="start"
    />

    <div v-else-if="phase === 'countdown'" class="card pad count">{{ toFa(count) }}</div>

    <div v-else-if="phase === 'playing' && q" class="card pad" :class="['play', flash]">
      <GameHud :score="score" :progress="`${toFa(asked)}/${toFa(STROOP_LIMITS.questions)}`" :time="timeLeft" />
      <p class="hint">{{ hint }}</p>

      <div class="stage">
        <div class="word" :style="{ color: `var(--c-${q.inkColor})` }">{{ labelOf(q.wordColor) }}</div>
        <div v-if="q.kind !== 'color'" class="arrowbox">
          <span class="arrow">{{ dirLabel(q.arrowDir).arrow }}</span>
          <small
            >{{ fa.games.stroop!.wordSays }} <b>{{ dirLabel(q.wordDir).label }}</b></small
          >
        </div>
      </div>

      <div v-if="q.answer.color !== undefined" class="opts">
        <button
          v-for="c in palette"
          :key="c.key"
          class="opt"
          :class="{ sel: given.color === c.key }"
          :style="{ background: `var(--c-${c.key})` }"
          @click="pick('color', c.key)"
        >
          {{ c.label }}
        </button>
      </div>
      <div v-if="q.answer.direction !== undefined" class="opts">
        <button
          v-for="d in STROOP_DIRS"
          :key="d.key"
          class="opt neutral"
          :class="{ sel: given.direction === d.key }"
          @click="pick('direction', d.key)"
        >
          {{ d.arrow }} {{ d.label }}
        </button>
      </div>
    </div>

    <GameResult v-else :score="score" :accuracy="accuracy" :save-state="saveState" :reward="reward" :good="8" :great="15" @again="start" />
  </div>
</template>

<style scoped>
.wrap {
  max-width: 560px;
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
.play {
  transition: box-shadow 200ms var(--ease);
}
.play.good {
  box-shadow: 0 0 0 3px var(--success);
}
.play.bad {
  box-shadow: 0 0 0 3px var(--danger);
}
.hint {
  color: var(--text-mid);
  margin: var(--sp-3) 0;
}
.stage {
  min-height: 150px;
  display: grid;
  place-items: center;
  gap: var(--sp-3);
}
.word {
  font-size: clamp(48px, 14vw, 72px);
  font-weight: 900;
}
.arrowbox {
  display: grid;
  gap: var(--sp-1);
  color: var(--text-mid);
}
.arrow {
  font-size: 56px;
  line-height: 1;
  color: var(--text-hi);
}
.opts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: var(--sp-3);
  margin-top: var(--sp-4);
}
.opt {
  min-height: 56px;
  border: 3px solid transparent;
  border-radius: var(--r-md);
  font-weight: 800;
  font-size: 18px;
  color: oklch(15% 0.02 250);
  transition: transform 120ms var(--ease);
}
.opt.neutral {
  background: var(--surface-hi);
  color: var(--text-hi);
  border-color: var(--line);
}
.opt.sel {
  border-color: var(--text-hi);
  transform: scale(1.04);
}
.opt:active {
  transform: scale(0.95);
}
</style>
