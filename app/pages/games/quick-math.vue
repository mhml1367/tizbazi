<script setup lang="ts">
import { fa } from '~/i18n/fa'
import { QM_LIMITS, answerScore, generateQuestion, type MathQuestion } from '~~/shared/games/quick-math'

const { phase, difficulty, count, saveState, reward, setDifficulty, countdown, finish } = useGameFlow('quick-math')

const q = ref<MathQuestion | null>(null)
const asked = ref(0)
const correct = ref(0)
const score = ref(0)
const timeLeft = ref(QM_LIMITS.seconds)
const flash = ref<'good' | 'bad' | ''>('')

let qStart = 0
let gameStart = 0
let ticker: ReturnType<typeof setInterval> | undefined
onBeforeUnmount(() => clearInterval(ticker))

const accuracy = computed(() => (asked.value ? Math.round((correct.value / asked.value) * 1000) / 10 : 0))
// نمایش ارقام فارسی داخل عبارت
const faText = (t: string) => t.replace(/\d+/g, (n) => toFa(n))

function start() {
  asked.value = correct.value = score.value = 0
  timeLeft.value = QM_LIMITS.seconds
  countdown(() => {
    gameStart = Date.now()
    next()
    ticker = setInterval(() => {
      timeLeft.value = Math.max(0, QM_LIMITS.seconds - Math.floor((Date.now() - gameStart) / 1000))
      if (timeLeft.value <= 0) end()
    }, 200)
  })
}

function next() {
  if (asked.value >= QM_LIMITS.questions) return end()
  q.value = generateQuestion(difficulty.value)
  qStart = Date.now()
}

function answer(v: number) {
  if (phase.value !== 'playing' || !q.value) return
  const ok = v === q.value.answer
  asked.value++
  if (ok) {
    correct.value++
    score.value += answerScore(true, Date.now() - qStart)
  }
  flash.value = ok ? 'good' : 'bad'
  setTimeout(() => (flash.value = ''), 250)
  next()
}

function end() {
  if (phase.value === 'done') return
  clearInterval(ticker)
  finish({ rawScore: score.value, accuracy: accuracy.value, duration: Date.now() - gameStart })
}
</script>

<template>
  <div class="wrap">
    <GameIntro
      v-if="phase === 'idle'"
      :name="fa.games['quick-math']!.name"
      :desc="fa.games['quick-math']!.desc"
      :difficulty="difficulty"
      @difficulty="setDifficulty"
      @start="start"
    />

    <div v-else-if="phase === 'countdown'" class="card pad count">{{ toFa(count) }}</div>

    <div v-else-if="phase === 'playing' && q" class="card pad" :class="['play', flash]">
      <GameHud :score="score" :progress="`${toFa(asked + 1)}/${toFa(QM_LIMITS.questions)}`" :time="timeLeft" />
      <div class="expr" dir="ltr">{{ faText(q.text) }} = ؟</div>
      <div class="opts">
        <button v-for="o in q.options" :key="o" class="opt" @click="answer(o)">{{ toFa(o) }}</button>
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
.expr {
  font-size: clamp(40px, 12vw, 64px);
  font-weight: 900;
  color: var(--text-hi);
  margin: var(--sp-6) 0;
}
.opts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-3);
}
.opt {
  min-height: 64px;
  border-radius: var(--r-md);
  border: 1px solid var(--line);
  background: var(--surface-hi);
  color: var(--text-hi);
  font-size: 28px;
  font-weight: 800;
  transition: transform 120ms var(--ease);
}
.opt:hover {
  transform: translateY(-2px);
  border-color: var(--accent);
}
.opt:active {
  transform: scale(0.95);
}
</style>
