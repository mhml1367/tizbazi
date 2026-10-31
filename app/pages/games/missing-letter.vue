<script setup lang="ts">
import { fa } from '~/i18n/fa'
import { ML_LIMITS, isRoundCorrect, roundScore, type MissingRound } from '~~/shared/games/missing-letter'

const { phase, difficulty, count, saveState, reward, setDifficulty, countdown, finish } = useGameFlow('missing-letter')

const rounds = ref<MissingRound[]>([])
const idx = ref(0)
const filled = ref<(string | null)[]>([])
const used = ref<number[]>([]) // اندیس گزینه‌های مصرف‌شده
const score = ref(0)
const correct = ref(0)
const secondsLeft = ref(ML_LIMITS.secondsPerWord)
const flash = ref<'good' | 'bad' | ''>('')
const loadError = ref('')

let wordStart = 0
let gameStart = 0
let ticker: ReturnType<typeof setInterval> | undefined
onBeforeUnmount(() => clearInterval(ticker))

const round = computed(() => rounds.value[idx.value])
const accuracy = computed(() => (rounds.value.length ? Math.round((correct.value / rounds.value.length) * 1000) / 10 : 0))

async function start() {
  loadError.value = ''
  try {
    rounds.value = (
      await $fetch<{ rounds: MissingRound[] }>('/api/games/missing-letter', { query: { difficulty: difficulty.value } })
    ).rounds
  } catch (e: any) {
    loadError.value = e?.data?.statusMessage || 'بارگذاری بازی انجام نشد'
    return
  }
  idx.value = 0
  score.value = correct.value = 0
  countdown(() => {
    gameStart = Date.now()
    beginRound()
    ticker = setInterval(tick, 200)
  })
}

function beginRound() {
  filled.value = round.value!.answer.map(() => null)
  used.value = []
  wordStart = Date.now()
  secondsLeft.value = ML_LIMITS.secondsPerWord
}

function tick() {
  const left = ML_LIMITS.secondsPerWord - (Date.now() - wordStart) / 1000
  secondsLeft.value = Math.max(0, left)
  if (left <= 0) settle(false)
}

function pick(i: number) {
  if (phase.value !== 'playing' || used.value.includes(i)) return
  const slot = filled.value.findIndex((x) => x === null)
  if (slot < 0) return
  filled.value[slot] = round.value!.options[i]!
  used.value.push(i)
  if (!filled.value.includes(null)) settle(isRoundCorrect(round.value!, filled.value as string[]))
}

function undo() {
  if (!used.value.length) return
  used.value.pop()
  const last = filled.value.map((x) => x !== null).lastIndexOf(true)
  if (last >= 0) filled.value[last] = null
}

function settle(ok: boolean) {
  if (ok) {
    correct.value++
    score.value += roundScore(true, secondsLeft.value)
  }
  flash.value = ok ? 'good' : 'bad'
  setTimeout(() => (flash.value = ''), 300)
  if (idx.value + 1 >= rounds.value.length) return end()
  idx.value++
  beginRound()
}

function end() {
  clearInterval(ticker)
  finish({ rawScore: score.value, accuracy: accuracy.value, duration: Date.now() - gameStart })
}

const letterAt = (i: number) => {
  const r = round.value!
  const slot = r.hidden.indexOf(i)
  return slot < 0 ? Array.from(r.word)[i]! : (filled.value[slot] ?? '_')
}
</script>

<template>
  <div class="wrap">
    <GameIntro
      v-if="phase === 'idle'"
      :name="fa.games['missing-letter']!.name"
      :desc="fa.games['missing-letter']!.desc"
      :difficulty="difficulty"
      :error="loadError"
      @difficulty="setDifficulty"
      @start="start"
    />

    <div v-else-if="phase === 'countdown'" class="card pad count">{{ toFa(count) }}</div>

    <div v-else-if="phase === 'playing' && round" class="card pad" :class="['play', flash]">
      <GameHud :score="score" :progress="`${toFa(idx + 1)}/${toFa(rounds.length)}`" :time="secondsLeft" />
      <GameTimer :left="secondsLeft" :total="ML_LIMITS.secondsPerWord" />

      <div class="word" dir="rtl" aria-label="کلمه">
        <span
          v-for="(_, i) in Array.from(round.word)"
          :key="i"
          class="cell"
          :class="{ blank: round.hidden.includes(i), done: round.hidden.includes(i) && filled[round.hidden.indexOf(i)] }"
          >{{ letterAt(i) }}</span
        >
      </div>

      <div class="opts">
        <button v-for="(o, i) in round.options" :key="i" class="opt" :disabled="used.includes(i)" @click="pick(i)">{{ o }}</button>
      </div>
      <button class="btn undo" :disabled="!used.length" @click="undo">⌫ {{ fa.games['missing-letter']!.undo }}</button>
    </div>

    <GameResult
      v-else
      :score="score"
      :accuracy="accuracy"
      :save-state="saveState"
      :reward="reward"
      :good="50"
      :great="100"
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
.word {
  display: flex;
  justify-content: center;
  gap: var(--sp-2);
  margin: var(--sp-5) 0;
  flex-wrap: wrap;
}
.cell {
  min-width: 48px;
  height: 64px;
  display: grid;
  place-items: center;
  font-size: 36px;
  font-weight: 900;
  color: var(--text-hi);
  border-bottom: 3px solid var(--line);
}
.cell.blank {
  color: var(--text-mid);
  border-color: var(--accent);
  background: var(--accent-soft);
  border-radius: var(--r-sm);
}
.cell.done {
  color: var(--accent);
}
.opts {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
  justify-content: center;
}
.opt {
  width: 56px;
  height: 56px;
  border-radius: var(--r-md);
  border: 1px solid var(--line);
  background: var(--surface-hi);
  color: var(--text-hi);
  font-size: 24px;
  font-weight: 800;
  transition: transform 120ms var(--ease);
}
.opt:hover:not(:disabled) {
  transform: translateY(-2px);
  border-color: var(--accent);
}
.opt:active:not(:disabled) {
  transform: scale(0.94);
}
.undo {
  margin-top: var(--sp-4);
}
</style>
