<script setup lang="ts">
import { fa } from '~/i18n/fa'
import { EF_CATEGORIES, pickRound, timeBonus, type EfStatus } from '~~/shared/games/esm-famil'

const { phase, difficulty, count, saveState, reward, setDifficulty, countdown, finish } = useGameFlow('esm-famil')
const T = fa.games['esm-famil']!
const ROUNDS = 3 // هر بازی سه حرف

interface Result {
  category: string
  answer: string
  status: EfStatus
  points: number
}

const round = ref(0)
const letter = ref('')
const categories = ref<string[]>([])
const answers = ref<Record<string, string>>({})
const results = ref<Result[] | null>(null)
const score = ref(0)
const verifiedTotal = ref(0)
const asked = ref(0)
const timeLeft = ref(0)
const busy = ref(false)
const usedLetters: string[] = []

let roundStart = 0
let started = 0
let seconds = 0
let ticker: ReturnType<typeof setInterval> | undefined
onBeforeUnmount(() => clearInterval(ticker))

const label = (id: string) => EF_CATEGORIES.find((c) => c.id === id)!.label
const accuracy = computed(() => (asked.value ? Math.round((verifiedTotal.value / asked.value) * 1000) / 10 : 0))

function start() {
  round.value = 0
  score.value = verifiedTotal.value = asked.value = 0
  usedLetters.length = 0
  countdown(() => {
    started = Date.now()
    nextRound()
  })
}

function nextRound() {
  // حرف تکراری در یک بازی نمی‌آید
  let r = pickRound(difficulty.value)
  while (usedLetters.includes(r.letter)) r = pickRound(difficulty.value)
  usedLetters.push(r.letter)
  round.value++
  letter.value = r.letter
  categories.value = r.categories
  answers.value = Object.fromEntries(r.categories.map((c) => [c, '']))
  results.value = null
  seconds = r.seconds
  timeLeft.value = seconds
  roundStart = Date.now()
  clearInterval(ticker)
  ticker = setInterval(() => {
    timeLeft.value = Math.max(0, seconds - Math.floor((Date.now() - roundStart) / 1000))
    if (timeLeft.value <= 0) submit()
  }, 250)
}

async function submit() {
  if (busy.value || results.value) return
  clearInterval(ticker)
  busy.value = true
  try {
    const res = await $fetch<{ results: Result[]; total: number }>('/api/games/esm-famil/check', {
      method: 'POST',
      body: { letter: letter.value, answers: { ...answers.value } }
    })
    results.value = res.results
    const verified = res.results.filter((r) => r.status === 'verified').length
    verifiedTotal.value += verified
    asked.value += categories.value.length
    score.value += res.total + timeBonus(timeLeft.value, verified, categories.value.length)
  } finally {
    busy.value = false
  }
}

function proceed() {
  if (round.value >= ROUNDS) finish({ rawScore: score.value, accuracy: accuracy.value, duration: Date.now() - started })
  else nextRound()
}

const statusIcon: Record<EfStatus, string> = { verified: '✅', word: '🟡', 'wrong-letter': '❌', unknown: '❌', empty: '➖' }
</script>

<template>
  <div class="game-wrap">
    <GameIntro v-if="phase === 'idle'" :name="T.name" :desc="T.desc" :difficulty="difficulty" @difficulty="setDifficulty" @start="start" />

    <div v-else-if="phase === 'countdown'" class="card game-pad game-count">{{ toFa(count) }}</div>

    <div v-else-if="phase === 'playing'" class="card game-pad">
      <GameHud :score="score" :progress="`${T.round} ${toFa(round)}/${toFa(ROUNDS)}`" :time="results ? undefined : timeLeft" />
      <GameTimer v-if="!results" :left="timeLeft" :total="seconds || 1" />
      <div class="letter-box">
        <small>{{ T.letter }}</small>
        <b>{{ letter }}</b>
      </div>

      <form v-if="!results" class="fields" @submit.prevent="submit">
        <label v-for="c in categories" :key="c">
          <span>{{ label(c) }}</span>
          <input v-model="answers[c]" class="input" autocomplete="off" :placeholder="`${letter}…`" />
        </label>
        <button class="btn btn-primary done" :disabled="busy">{{ busy ? T.checking : T.done }}</button>
      </form>

      <div v-else>
        <ul class="results">
          <li v-for="r in results" :key="r.category" :class="r.status">
            <span class="cat">{{ label(r.category) }}</span>
            <span class="ans">{{ r.answer || '—' }}</span>
            <span class="st">{{ statusIcon[r.status] }} {{ T[r.status] }}</span>
            <b class="pts">+{{ toFa(r.points) }}</b>
          </li>
        </ul>
        <button class="btn btn-primary" @click="proceed">{{ round >= ROUNDS ? fa.common.submit : T.next }}</button>
      </div>
    </div>

    <GameResult
      v-else
      :score="score"
      :accuracy="accuracy"
      :save-state="saveState"
      :reward="reward"
      :good="120"
      :great="220"
      @again="start"
    />
  </div>
</template>

<style scoped>
.letter-box {
  display: inline-grid;
  place-items: center;
  width: 88px;
  height: 88px;
  margin: var(--sp-3) auto;
  border-radius: 50%;
  background: var(--accent);
  color: var(--on-accent);
}
.letter-box b {
  font-size: 40px;
  line-height: 1;
}
.letter-box small {
  font-size: 12px;
}
.fields {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--sp-3);
  text-align: start;
}
.fields label {
  display: grid;
  gap: var(--sp-1);
  font-size: 14px;
  color: var(--text-mid);
  font-weight: 700;
}
.done {
  grid-column: 1 / -1;
}
.results {
  list-style: none;
  padding: 0;
  margin: var(--sp-3) 0;
  display: grid;
  gap: var(--sp-2);
  text-align: start;
}
.results li {
  display: grid;
  grid-template-columns: 70px 1fr auto 40px;
  gap: var(--sp-2);
  align-items: center;
  padding: var(--sp-2) var(--sp-3);
  border-radius: var(--r-sm);
  background: var(--surface-hi);
}
.results li.verified {
  border-inline-start: 4px solid var(--success);
}
.results li.word {
  border-inline-start: 4px solid var(--c-yellow);
}
.cat {
  color: var(--text-mid);
  font-size: 13px;
}
.ans {
  font-weight: 800;
  color: var(--text-hi);
}
.st {
  font-size: 12px;
  color: var(--text-mid);
}
.pts {
  color: var(--accent);
}
@media (max-width: 480px) {
  .results li {
    grid-template-columns: 60px 1fr 36px;
  }
  .st {
    display: none;
  }
}
</style>
