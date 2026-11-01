<script setup lang="ts">
import { fa } from '~/i18n/fa'
import { lastLetter } from '~~/shared/persian'
import { STUMP_BONUS, WC, wordPoints } from '~~/shared/games/word-chain'

const { phase, difficulty, count, saveState, reward, setDifficulty, countdown, finish } = useGameFlow('word-chain')
const T = fa.games['word-chain']!

const chain = ref<{ by: 'ai' | 'me'; word: string }[]>([])
const input = ref('')
const lives = ref(WC.lives)
const score = ref(0)
const valid = ref(0)
const invalid = ref(0)
const error = ref('')
const busy = ref(false)
const stumped = ref(false)
const timeLeft = ref(0)
const inputEl = ref<HTMLInputElement | null>(null)
const listEl = ref<HTMLElement | null>(null)

let turnStart = 0
let started = 0
let ticker: ReturnType<typeof setInterval> | undefined
onBeforeUnmount(() => clearInterval(ticker))

const seconds = computed(() => WC.seconds[difficulty.value])
const need = computed(() => (chain.value.length ? lastLetter(chain.value[chain.value.length - 1]!.word) : ''))
const accuracy = computed(() => (valid.value + invalid.value ? Math.round((valid.value / (valid.value + invalid.value)) * 1000) / 10 : 0))
const history = () => chain.value.map((c) => c.word)
const lastWord = computed(() => chain.value[chain.value.length - 1])

/** جدا کردن حرف آخر (حرف پیوند) برای رنگی کردن؛ «ء» و نشانه‌های انتهایی کنار گذاشته می‌شوند */
function split(word: string) {
  const chars = Array.from(word)
  let i = chars.length - 1
  while (i > 0 && !/[آ-ی]/.test(chars[i]!)) i--
  if (chars[i] === 'ء' && i > 0) i--
  return { head: chars.slice(0, i).join(''), last: chars[i] ?? '', tail: chars.slice(i + 1).join('') }
}

// امتیاز شناور «+n» و لرزش برای کلمهٔ نادرست
const gain = ref(0)
const gainKey = ref(0)
const shake = ref(false)
function bump(n: number) {
  gain.value = n
  gainKey.value++
}
function wobble() {
  shake.value = true
  setTimeout(() => (shake.value = false), 400)
}

async function start() {
  chain.value = []
  lives.value = WC.lives
  score.value = valid.value = invalid.value = 0
  error.value = ''
  stumped.value = false
  input.value = ''
  const first = await $fetch<{ reply: string }>('/api/games/word-chain', {
    method: 'POST',
    body: { difficulty: difficulty.value, history: [] }
  })
  chain.value = [{ by: 'ai', word: first.reply }]
  countdown(() => {
    started = Date.now()
    newTurn()
    ticker = setInterval(() => {
      if (busy.value) return // نوبت رایانه از وقت کاربر کم نمی‌شود
      timeLeft.value = Math.max(0, seconds.value - (Date.now() - turnStart) / 1000)
      if (timeLeft.value <= 0) {
        error.value = T.timeout
        end()
      }
    }, 200)
  })
}

function newTurn() {
  turnStart = Date.now()
  timeLeft.value = seconds.value
  nextTick(() => {
    inputEl.value?.focus()
    // ردِ زنجیره افقی است؛ در RTL جدیدترین کلمه سمت چپ است
    listEl.value?.scrollTo({ left: -listEl.value.scrollWidth })
  })
}

async function submit() {
  const word = input.value.trim()
  if (!word || busy.value || phase.value !== 'playing') return
  busy.value = true
  try {
    const r = await $fetch<{ ok: boolean; error?: string; word?: string; reply?: string | null }>('/api/games/word-chain', {
      method: 'POST',
      body: { difficulty: difficulty.value, history: history(), word }
    })
    if (!r.ok) {
      invalid.value++
      lives.value--
      error.value = T[r.error!] ?? ''
      wobble()
      if (lives.value <= 0) end()
      return
    }
    error.value = ''
    valid.value++
    const pts = wordPoints(r.word!)
    score.value += pts
    bump(pts)
    chain.value = [...chain.value, { by: 'me', word: r.word! }]
    input.value = ''
    if (!r.reply) {
      stumped.value = true
      score.value += STUMP_BONUS
      return end()
    }
    // مکث کوتاه تا کلمهٔ کاربر دیده شود، بعد جواب رایانه
    await new Promise((res) => setTimeout(res, 450))
    chain.value = [...chain.value, { by: 'ai', word: r.reply }]
    newTurn()
  } finally {
    busy.value = false
  }
}

function end() {
  if (phase.value !== 'playing') return
  clearInterval(ticker)
  finish({ rawScore: score.value, accuracy: accuracy.value, duration: Date.now() - started })
}
</script>

<template>
  <div class="game-wrap">
    <GameIntro v-if="phase === 'idle'" :name="T.name" :desc="T.desc" :difficulty="difficulty" @difficulty="setDifficulty" @start="start" />

    <div v-else-if="phase === 'countdown'" class="card game-pad game-count">{{ toFa(count) }}</div>

    <div v-else-if="phase === 'playing'" class="card game-pad play">
      <!-- دو بازیکن: نوبت هر کس روشن است -->
      <div class="players">
        <div class="pl" :class="{ active: !busy }">
          <span class="av">🙂</span>
          <span>
            <b>{{ T.you }}</b>
            <span class="hearts" :aria-label="`${toFa(lives)} ${T.lives}`">
              <i v-for="k in WC.lives" :key="k" :class="{ lost: k > lives }">❤</i>
            </span>
          </span>
        </div>
        <div class="sc">
          <b>{{ toFa(score) }}</b>
          <small class="muted">{{ fa.common.score }}</small>
          <span v-if="gain" :key="gainKey" class="gain">+{{ toFa(gain) }}</span>
        </div>
        <div class="pl ai" :class="{ active: busy }">
          <span>
            <b>{{ T.ai }}</b>
            <small class="muted">{{ toFa(valid) }} {{ T.count }}</small>
          </span>
          <span class="av" :class="{ think: busy }">🤖</span>
        </div>
      </div>
      <GameTimer :left="timeLeft" :total="seconds" />

      <!-- ردِ زنجیره: کلمه‌های قبلی کوچک، حرف پیوند رنگی -->
      <ol ref="listEl" class="trail" aria-label="زنجیره">
        <li v-for="(c, i) in chain.slice(0, -1)" :key="i" :class="c.by">
          <span
            >{{ split(c.word).head }}<b>{{ split(c.word).last }}</b
            >{{ split(c.word).tail }}</span
          >
        </li>
      </ol>

      <div v-if="lastWord" :key="chain.length" class="current" :class="lastWord.by">
        <small class="muted">{{ lastWord.by === 'ai' ? T.ai : T.you }}</small>
        <div class="big">
          {{ split(lastWord.word).head }}<b class="link">{{ split(lastWord.word).last }}</b
          >{{ split(lastWord.word).tail }}
        </div>
      </div>

      <p class="turn">
        {{ busy ? T.aiTurn : T.yourTurn }} <b v-if="!busy" class="letter">{{ need }}</b>
      </p>
      <form class="answer" :class="{ shake }" @submit.prevent="submit">
        <span class="need" aria-hidden="true">{{ need }}</span>
        <input
          ref="inputEl"
          v-model="input"
          class="input"
          autocomplete="off"
          :aria-label="`${T.you}: ${need}`"
          :placeholder="T.placeholder.replace('{l}', need)"
          :disabled="busy"
        />
        <button class="btn btn-primary" :disabled="busy || !input.trim()">{{ fa.common.submit }}</button>
      </form>
      <p class="error msg" role="alert">{{ error }}</p>
    </div>

    <div v-else>
      <p v-if="stumped" class="card game-pad win">{{ T.stumped }}</p>
      <p v-else-if="error" class="card game-pad">{{ error }}</p>
      <GameResult :score="score" :accuracy="accuracy" :save-state="saveState" :reward="reward" :good="60" :great="150" @again="start" />
    </div>
  </div>
</template>

<style scoped>
.players {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: var(--sp-2);
  margin-bottom: var(--sp-3);
}
.pl {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-2);
  border-radius: var(--r-md);
  border: 2px solid transparent;
  opacity: 0.6;
  transition:
    opacity 200ms var(--ease),
    border-color 200ms var(--ease);
  text-align: start;
}
.pl > span:not(.av) {
  display: grid;
  line-height: 1.4;
}
.pl.ai {
  justify-content: flex-end;
  text-align: end;
}
.pl.active {
  opacity: 1;
  border-color: var(--accent);
  background: var(--accent-soft);
}
.av {
  font-size: 30px;
  line-height: 1;
}
.av.think {
  animation: think 0.8s ease-in-out infinite;
}
@keyframes think {
  50% {
    transform: rotate(-12deg) scale(1.1);
  }
}
.hearts {
  white-space: nowrap;
  font-size: 14px;
}
.hearts i {
  font-style: normal;
  color: var(--c-red);
  margin-inline-end: 2px;
}
.hearts i.lost {
  color: var(--line);
}
.sc {
  position: relative;
  display: grid;
  line-height: 1.2;
}
.sc b {
  font-size: 26px;
  color: var(--accent);
}
.gain {
  position: absolute;
  inset-inline: 0;
  top: -6px;
  font-weight: 900;
  color: var(--success);
  animation: float-up 900ms var(--ease) forwards;
}
@keyframes float-up {
  to {
    opacity: 0;
    transform: translateY(-26px);
  }
}
.trail {
  list-style: none;
  padding: var(--sp-2) 0;
  margin: var(--sp-3) 0 0;
  display: flex;
  gap: var(--sp-2);
  overflow-x: auto;
  scrollbar-width: none;
  /* محو شدن سمت کلمه‌های قدیمی (راست) */
  mask-image: linear-gradient(to right, #000 75%, transparent);
}
.trail:empty {
  display: none;
}
.trail li {
  flex: none;
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}
/* فلش پیوند بین کلمه‌ها */
.trail li:not(:first-child)::before {
  content: '←';
  color: var(--text-mid);
}
.trail span {
  padding: 2px var(--sp-3);
  border-radius: 50px;
  font-weight: 700;
  font-size: 15px;
  border: 1px solid var(--line);
  color: var(--text);
}
.trail li.me span {
  border-color: var(--accent);
}
.trail b {
  color: var(--accent);
}
.current {
  margin: var(--sp-3) 0;
  padding: var(--sp-4);
  border-radius: var(--r-lg);
  background: var(--surface-hi);
  animation: pop-in 350ms var(--ease);
}
.current.me {
  background: var(--accent-soft);
}
@keyframes pop-in {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
}
.big {
  font-size: clamp(32px, 9vw, 46px);
  font-weight: 900;
  color: var(--text-hi);
  line-height: 1.5;
}
.link {
  color: var(--c-orange);
  text-decoration: underline wavy;
  text-underline-offset: 10px;
  text-decoration-thickness: 2px;
}
.turn {
  margin: 0 0 var(--sp-2);
  color: var(--text-mid);
}
.letter {
  display: inline-grid;
  place-items: center;
  min-width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--c-orange);
  color: #1c1917;
  font-size: 20px;
}
.answer {
  position: relative;
  display: flex;
  gap: var(--sp-2);
}
.need {
  position: absolute;
  inset-inline-start: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: var(--r-sm);
  background: var(--c-orange);
  color: #1c1917;
  font-weight: 900;
  font-size: 18px;
  pointer-events: none;
}
.input {
  font-size: 22px;
  min-height: 56px;
  padding-inline-start: 54px;
  border-width: 2px;
}
.input:focus {
  border-color: var(--accent);
  outline: none;
}
.answer .btn {
  min-height: 56px;
}
.msg {
  min-height: 1.8em;
  margin: var(--sp-2) 0 0;
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
.win {
  font-size: 20px;
  font-weight: 800;
  color: var(--success);
  margin-bottom: var(--sp-3);
}
</style>
