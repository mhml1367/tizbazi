<script setup lang="ts">
import { fa } from '~/i18n/fa'
import {
  RM_GAP_MS,
  RM_ROUNDS,
  RM_RULES,
  generateDigits,
  isReverseCorrect,
  lengthForRound,
  parseAnswer,
  roundScore
} from '~~/shared/games/reverse-memory'

const { phase, difficulty, count, saveState, reward, setDifficulty, countdown, finish } = useGameFlow('reverse-memory')

const sub = ref<'show' | 'input'>('show')
const seq = ref<number[]>([])
const shown = ref<number | null>(null)
const round = ref(1)
const input = ref('')
const score = ref(0)
const completed = ref(0)
const failed = ref(false)
const flash = ref<'good' | 'bad' | ''>('')
const inputEl = ref<HTMLInputElement | null>(null)

let gameStart = 0
let runId = 0
onBeforeUnmount(() => runId++)

const rules = computed(() => RM_RULES[difficulty.value])
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
    play()
  })
}

async function play() {
  const my = ++runId
  sub.value = 'show'
  input.value = ''
  seq.value = generateDigits(lengthForRound(round.value), rules.value.twoDigit)
  await sleep(500)
  for (const n of seq.value) {
    if (my !== runId) return
    shown.value = n
    await sleep(rules.value.showMs)
    shown.value = null
    await sleep(RM_GAP_MS)
  }
  if (my !== runId) return
  sub.value = 'input'
  await nextTick()
  inputEl.value?.focus()
}

async function submit() {
  if (phase.value !== 'playing' || sub.value !== 'input') return
  const ok = isReverseCorrect(seq.value, parseAnswer(input.value, rules.value.twoDigit))
  flash.value = ok ? 'good' : 'bad'
  setTimeout(() => (flash.value = ''), 300)
  if (!ok) {
    failed.value = true
    return end()
  }
  score.value += roundScore(round.value)
  completed.value++
  if (round.value >= RM_ROUNDS) return end()
  round.value++
  await sleep(400)
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
      :name="fa.games['reverse-memory']!.name"
      :desc="fa.games['reverse-memory']!.desc"
      :difficulty="difficulty"
      @difficulty="setDifficulty"
      @start="start"
    />

    <div v-else-if="phase === 'countdown'" class="card pad count">{{ toFa(count) }}</div>

    <div v-else-if="phase === 'playing'" class="card pad" :class="['play', flash]">
      <GameHud :score="score" :progress="`${fa.common.stage} ${toFa(round)}/${toFa(RM_ROUNDS)}`" />
      <template v-if="sub === 'show'">
        <p class="status">{{ fa.games['reverse-memory']!.watch }}</p>
        <div class="digit" aria-live="polite">{{ shown === null ? '' : toFa(shown) }}</div>
      </template>
      <template v-else>
        <p class="status">{{ fa.games['reverse-memory']!.enter }}</p>
        <form class="answer" @submit.prevent="submit">
          <input ref="inputEl" v-model="input" class="input" inputmode="numeric" autocomplete="off" aria-label="پاسخ" dir="ltr" />
          <button class="btn btn-primary">{{ fa.common.submit }}</button>
        </form>
        <p v-if="rules.twoDigit" class="note">{{ fa.games['reverse-memory']!.sepHint }}</p>
      </template>
    </div>

    <GameResult
      v-else
      :score="score"
      :accuracy="accuracy"
      :save-state="saveState"
      :reward="reward"
      :good="60"
      :great="200"
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
.play {
  transition: box-shadow 200ms var(--ease);
}
.play.good {
  box-shadow: 0 0 0 3px var(--success);
}
.play.bad {
  box-shadow: 0 0 0 3px var(--danger);
}
.status {
  color: var(--text-mid);
}
.digit {
  font-size: 120px;
  font-weight: 900;
  color: var(--accent);
  min-height: 180px;
  line-height: 180px;
}
.answer {
  display: flex;
  gap: var(--sp-3);
  margin-top: var(--sp-5);
}
.input {
  font-size: 24px;
  text-align: center;
  letter-spacing: 0.1em;
}
.note {
  color: var(--text-mid);
  font-size: 13px;
}
</style>
