<script setup lang="ts">
import { fa } from '~/i18n/fa'
import { CB_RULES, codeScore, feedback, makeSecret, validGuess } from '~~/shared/games/code-breaker'

const { phase, difficulty, count, saveState, reward, setDifficulty, countdown, finish } = useGameFlow('code-breaker')
const T = fa.games['code-breaker']!

const secret = ref<number[]>([])
const current = ref<number[]>([])
const rows = ref<{ guess: number[]; exact: number; present: number }[]>([])
const solved = ref(false)
const shake = ref(false)
const rowsEl = ref<HTMLElement | null>(null)
let started = 0

const rules = computed(() => CB_RULES[difficulty.value])
const score = computed(() => codeScore(solved.value, difficulty.value, rows.value.length))

function start() {
  secret.value = makeSecret(difficulty.value)
  current.value = []
  rows.value = []
  solved.value = false
  countdown(() => (started = Date.now()))
}

function press(d: number) {
  if (phase.value !== 'playing' || current.value.length >= rules.value.length) return
  if (!rules.value.repeats && current.value.includes(d)) return
  current.value = [...current.value, d]
}
const erase = () => (current.value = current.value.slice(0, -1))

function submit() {
  if (!validGuess(current.value, difficulty.value)) {
    shake.value = true
    setTimeout(() => (shake.value = false), 400)
    return
  }
  const f = feedback(secret.value, current.value)
  rows.value = [...rows.value, { guess: current.value, ...f }]
  current.value = []
  nextTick(() => rowsEl.value?.scrollTo({ top: rowsEl.value.scrollHeight, behavior: 'smooth' }))
  if (f.exact === rules.value.length) solved.value = true
  if (solved.value || rows.value.length >= rules.value.attempts) {
    finish({ rawScore: score.value, accuracy: solved.value ? 100 : 0, duration: Date.now() - started })
  }
}

// پشتیبانی از صفحه‌کلید فیزیکی (ارقام لاتین و فارسی)
function onKey(e: KeyboardEvent) {
  if (phase.value !== 'playing') return
  const d = '0123456789'.indexOf(e.key) >= 0 ? Number(e.key) : '۰۱۲۳۴۵۶۷۸۹'.indexOf(e.key)
  if (d >= 0) press(d)
  else if (e.key === 'Backspace') erase()
  else if (e.key === 'Enter') submit()
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="game-wrap">
    <GameIntro v-if="phase === 'idle'" :name="T.name" :desc="T.desc" :difficulty="difficulty" @difficulty="setDifficulty" @start="start" />

    <div v-else-if="phase === 'countdown'" class="card game-pad game-count">{{ toFa(count) }}</div>

    <div v-else-if="phase === 'playing'" class="card game-pad">
      <GameHud :score="score" :progress="`${T.attempts}: ${toFa(rows.length)}/${toFa(rules.attempts)}`" />
      <p class="muted rule">🔐 {{ toFa(rules.length) }} رقم · {{ rules.repeats ? T.repeat : T.noRepeat }}</p>
      <div class="legend">
        <span><i class="peg ex" /> {{ T.exact }}</span>
        <span><i class="peg pr" /> {{ T.present }}</span>
        <span><i class="peg no" /> {{ T.absent }}</span>
      </div>

      <!-- تاریخچهٔ حدس‌ها در جعبهٔ پیمایشی تا صفحه‌کلید جابه‌جا نشود -->
      <ol ref="rowsEl" class="rows">
        <li v-if="!rows.length" class="empty muted">{{ T.firstGuess }}</li>
        <li v-for="(r, i) in rows" :key="i" class="row" :class="{ win: r.exact === rules.length }">
          <span class="num">{{ toFa(i + 1) }}</span>
          <span class="digits" dir="ltr">
            <span v-for="(d, j) in r.guess" :key="j" class="d">{{ toFa(d) }}</span>
          </span>
          <!-- میخ‌های بازخورد: سبز = سر جا، نارنجی = جابه‌جا، خالی = نیست -->
          <span
            class="pegs"
            :style="{ gridTemplateColumns: `repeat(${Math.ceil(rules.length / 2)}, 14px)` }"
            :aria-label="`${toFa(r.exact)} ${T.exact}، ${toFa(r.present)} ${T.present}`"
          >
            <i v-for="k in r.exact" :key="`e${k}`" class="peg ex" />
            <i v-for="k in r.present" :key="`p${k}`" class="peg pr" />
            <i v-for="k in rules.length - r.exact - r.present" :key="`n${k}`" class="peg no" />
          </span>
        </li>
      </ol>

      <div class="digits current" :class="{ shake }" dir="ltr" aria-live="polite">
        <span
          v-for="j in rules.length"
          :key="j"
          class="d slot"
          :class="{ on: current[j - 1] !== undefined, next: j - 1 === current.length }"
        >
          {{ current[j - 1] !== undefined ? toFa(current[j - 1]!) : '' }}
        </span>
      </div>

      <div class="keypad" dir="ltr">
        <button
          v-for="d in [1, 2, 3, 4, 5, 6, 7, 8, 9]"
          :key="d"
          class="opt-btn key"
          :disabled="!rules.repeats && current.includes(d)"
          @click="press(d)"
        >
          {{ toFa(d) }}
        </button>
        <button class="opt-btn key fn" :aria-label="T.erase" @click="erase">⌫</button>
        <button class="opt-btn key" :disabled="!rules.repeats && current.includes(0)" @click="press(0)">{{ toFa(0) }}</button>
        <button class="btn btn-primary key fn" :disabled="current.length < rules.length" @click="submit">✓</button>
      </div>
    </div>

    <div v-else>
      <p class="card game-pad reveal">
        {{ T.secret }} <b dir="ltr">{{ secret.map((d) => toFa(d)).join(' ') }}</b>
      </p>
      <GameResult
        :score="score"
        :accuracy="solved ? 100 : 0"
        :save-state="saveState"
        :reward="reward"
        :good="40"
        :great="90"
        @again="start"
      />
    </div>
  </div>
</template>

<style scoped>
.rule {
  margin: var(--sp-2) 0 0;
}
.legend {
  display: flex;
  justify-content: center;
  gap: var(--sp-4);
  font-size: 13px;
  color: var(--text-mid);
  flex-wrap: wrap;
}
.legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.rows {
  list-style: none;
  padding: var(--sp-2);
  margin: var(--sp-3) 0;
  display: grid;
  align-content: start;
  gap: var(--sp-2);
  height: 200px;
  overflow-y: auto;
  border-radius: var(--r-md);
  border: 1px solid var(--line);
  scrollbar-width: thin;
}
.empty {
  align-self: center;
  padding-top: 70px;
  font-size: 14px;
}
.row {
  display: grid;
  grid-template-columns: 28px 1fr auto;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-2) var(--sp-3);
  border-radius: var(--r-md);
  background: var(--surface-hi);
  animation: slide-in 280ms var(--ease);
}
.row.win {
  background: color-mix(in oklch, var(--success) 22%, var(--surface-hi));
}
@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
}
.num {
  font-size: 13px;
  color: var(--text-mid);
}
.digits {
  display: flex;
  gap: var(--sp-2);
  justify-content: center;
}
.d {
  width: 40px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: var(--r-sm);
  border: 1px solid var(--line);
  background: var(--surface);
  font-size: 22px;
  font-weight: 800;
  color: var(--text-hi);
}
.pegs {
  display: grid;
  gap: 5px;
  justify-content: end;
}
.peg {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 50%;
}
.peg.ex {
  background: var(--success);
  box-shadow: 0 0 8px color-mix(in oklch, var(--success) 60%, transparent);
}
.peg.pr {
  background: var(--c-orange);
}
.peg.no {
  border: 2px solid var(--line);
}
.current {
  margin: var(--sp-4) 0;
}
.current .d {
  width: 52px;
  height: 60px;
  font-size: 30px;
}
.slot {
  border: 2px dashed var(--line);
}
.slot.on {
  border-style: solid;
  border-color: var(--accent);
  animation: pop 200ms var(--ease);
}
.slot.next {
  border-color: var(--accent);
}
@keyframes pop {
  from {
    transform: scale(0.8);
  }
}
.keypad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--sp-2);
  max-width: 320px;
  margin-inline: auto;
}
.key {
  min-height: 56px;
  font-size: 24px;
}
.key.fn {
  font-size: 22px;
}
.shake {
  animation: shake 0.35s;
}
@keyframes shake {
  25%,
  75% {
    transform: translateX(-6px);
  }
  50% {
    transform: translateX(6px);
  }
}
.reveal {
  font-size: 18px;
  margin-bottom: var(--sp-3);
}
</style>
