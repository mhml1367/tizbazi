<script setup lang="ts">
import { fa } from '~/i18n/fa'
import { normalizeFa } from '~~/shared/persian'
import { KEYBOARD_ROWS, WD, shareText, wordleScore, type Mark } from '~~/shared/games/wordle'
import { TIER_EMOJI, TIER_LINES, pickBySeed, resultTier } from '~~/shared/reaction'

// امتیاز این بازی را سرور هنگام پایان معما ثبت می‌کند؛ اینجا فقط نمایش و ورودی است
interface Row {
  word: string
  marks: Mark[]
}
interface State {
  mode: 'daily' | 'practice'
  day: string | null
  rows: Row[]
  solved: boolean
  finished: boolean
  answer: string | null
  reward?: any
}

const { user, refresh, loaded } = useAuth()
const T = fa.games['word-of-day']!
const mode = ref<'daily' | 'practice'>('daily')
const state = ref<State | null>(null)
const current = ref<string[]>([])
const error = ref('')
const busy = ref(false)
const shake = ref(false)
const copied = ref(false)
const reward = ref<any>(null)

async function load(fresh = false) {
  error.value = ''
  reward.value = null
  current.value = []
  state.value = await $fetch<State>('/api/games/word-of-day', { query: { mode: mode.value, fresh: fresh ? '1' : undefined } })
}

onMounted(async () => {
  if (!loaded.value) await refresh()
  if (!user.value) return navigateTo('/login?next=/games/word-of-day')
  await load()
  window.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
watch(mode, () => load())

const done = computed(() => !!state.value?.finished)

// واکنش پایان: حل در ۳ حدس یا کمتر «عالی»، تا ۵ حدس «خوب»
const seed = Math.floor(Math.random() * 1000)
const tier = computed(() => {
  const s = state.value
  const score = s?.solved ? wordleScore(s.rows.length) : 0
  return resultTier(score, wordleScore(5), wordleScore(3), reward.value?.record)
})

function type(ch: string) {
  if (done.value || current.value.length >= WD.length) return
  current.value = [...current.value, ch]
}
const erase = () => (current.value = current.value.slice(0, -1))

function bump(msg: string) {
  error.value = msg
  shake.value = true
  setTimeout(() => (shake.value = false), 400)
}

async function submit() {
  if (done.value || busy.value) return
  if (current.value.length !== WD.length) return bump(T.need5!)
  busy.value = true
  try {
    const res = await $fetch<State>('/api/games/word-of-day/guess', {
      method: 'POST',
      body: { mode: mode.value, guess: current.value.join('') }
    })
    state.value = res
    reward.value = res.reward ?? null
    current.value = []
    error.value = ''
  } catch (e: any) {
    bump(e?.data?.statusMessage || 'خطا')
  } finally {
    busy.value = false
  }
}

const KEY_LETTERS = new Set(KEYBOARD_ROWS.flat())
function onKey(e: KeyboardEvent) {
  if (e.ctrlKey || e.metaKey || e.altKey) return
  const k = normalizeFa(e.key)
  if (KEY_LETTERS.has(k)) type(k)
  else if (e.key === 'Backspace') erase()
  else if (e.key === 'Enter') submit()
}

/** جدول ۶ ردیف: ردیف‌های ثبت‌شده، ردیف در حال تایپ، و ردیف‌های خالی */
const grid = computed(() => {
  const rows = (state.value?.rows ?? []).map((r) => Array.from(r.word).map((ch, i) => ({ ch, mark: r.marks[i] as Mark | '' })))
  if (!done.value && rows.length < WD.maxGuesses)
    rows.push(Array.from({ length: WD.length }, (_, i) => ({ ch: current.value[i] ?? '', mark: '' as const })))
  while (rows.length < WD.maxGuesses) rows.push(Array.from({ length: WD.length }, () => ({ ch: '', mark: '' as const })))
  return rows
})

/** بهترین وضعیت دیده‌شدهٔ هر حرف برای رنگ صفحه‌کلید */
const keyMarks = computed(() => {
  const rank = { g: 3, y: 2, b: 1 } as const
  const m = new Map<string, Mark>()
  for (const r of state.value?.rows ?? [])
    Array.from(r.word).forEach((ch, i) => {
      const cur = m.get(ch)
      const mk = r.marks[i]!
      if (!cur || rank[mk] > rank[cur]) m.set(ch, mk)
    })
  return m
})

async function share() {
  if (!state.value) return
  const title = state.value.day
    ? `${T.name} ${new Intl.DateTimeFormat('fa-IR-u-ca-persian', { dateStyle: 'short', timeZone: 'Asia/Tehran' }).format(new Date())}`
    : `${T.name} (${T.practice})`
  try {
    await navigator.clipboard.writeText(
      shareText(
        title,
        state.value.rows.map((r) => r.marks),
        state.value.solved
      )
    )
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  } catch {
    /* کلیپ‌بورد در دسترس نیست */
  }
}
</script>

<template>
  <div class="game-wrap">
    <div class="card game-pad wod">
      <div class="banner"><GameArt game="word-of-day" /></div>
      <h1>{{ T.name }}</h1>
      <div class="tabs" role="tablist">
        <button role="tab" :aria-selected="mode === 'daily'" class="chip" :class="{ on: mode === 'daily' }" @click="mode = 'daily'">
          {{ T.daily }}
        </button>
        <button
          role="tab"
          :aria-selected="mode === 'practice'"
          class="chip"
          :class="{ on: mode === 'practice' }"
          @click="mode = 'practice'"
        >
          {{ T.practice }}
        </button>
      </div>
      <p class="muted how">{{ T.howTo }}</p>

      <div v-if="state" class="grid" :class="{ shake }" aria-live="polite">
        <div v-for="(row, r) in grid" :key="r" class="row">
          <span v-for="(c, i) in row" :key="i" class="cell" :class="[c.mark, { filled: c.ch }]">{{ c.ch }}</span>
        </div>
      </div>
      <p v-if="error" class="error" role="alert">{{ error }}</p>

      <div v-if="state && done" class="end">
        <ConfettiBurst v-if="reward && (tier === 'record' || tier === 'great')" />
        <div class="emoji" aria-hidden="true">{{ pickBySeed(TIER_EMOJI[tier], seed) }}</div>
        <h2 class="line">{{ pickBySeed(TIER_LINES[tier], seed) }}</h2>
        <p v-if="state.solved" class="win">{{ T.solved }} ({{ toFa(state.rows.length) }}/{{ toFa(WD.maxGuesses) }})</p>
        <p v-else>
          {{ T.failed }} <b class="answer">{{ state.answer }}</b>
        </p>
        <p v-if="reward">+{{ toFa(reward.xpGained) }} {{ fa.common.xp }} · {{ fa.common.level }} {{ toFa(reward.level) }}</p>
        <p v-for="a in reward?.newAchievements ?? []" :key="a.id" class="ach">🏅 {{ fa.common.newAchievement }}: {{ a.title }}</p>
        <div class="row-btns">
          <button class="btn btn-primary" @click="share">{{ copied ? T.copied : T.share }}</button>
          <button v-if="mode === 'practice'" class="btn" @click="load(true)">{{ T.newPractice }}</button>
          <button v-else class="btn" @click="mode = 'practice'">{{ T.practice }}</button>
        </div>
      </div>

      <!-- مثل کیبورد فیزیکی فارسی: «ض» در چپ‌ترین جا -->
      <div v-else-if="state" class="kbd" dir="ltr">
        <div v-for="(r, i) in KEYBOARD_ROWS" :key="i" class="krow">
          <button v-for="k in r" :key="k" class="key" :class="keyMarks.get(k)" :disabled="busy" @click="type(k)">{{ k }}</button>
        </div>
        <div class="krow">
          <button class="key wide enter" :disabled="busy" @click="submit">{{ T.enter }}</button>
          <button class="key wide" @click="erase">⌫ {{ T.erase }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wod {
  overflow: hidden;
}
.banner {
  margin: calc(-1 * var(--sp-5)) calc(-1 * var(--sp-5)) var(--sp-3);
  height: 96px;
  overflow: hidden;
}
h1 {
  margin: 0 0 var(--sp-2);
  color: var(--text-hi);
}
.tabs {
  display: flex;
  gap: var(--sp-2);
  justify-content: center;
}
.chip {
  min-height: 44px;
  padding: 0 var(--sp-5);
  border-radius: 50px;
  border: 1px solid var(--line);
  background: var(--surface-hi);
}
.chip.on {
  background: var(--accent);
  color: var(--on-accent);
  border-color: transparent;
  font-weight: 700;
}
.how {
  font-size: 13px;
}
.grid {
  display: grid;
  gap: 6px;
  justify-content: center;
  margin: var(--sp-4) 0;
}
.row {
  display: grid;
  grid-template-columns: repeat(5, clamp(48px, 14vw, 60px));
  gap: 6px;
}
.cell {
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  border: 2px solid var(--line);
  border-radius: var(--r-sm);
  font-size: clamp(24px, 7vw, 30px);
  font-weight: 900;
  color: var(--text-hi);
  transition:
    background 200ms var(--ease),
    transform 120ms var(--ease);
}
.cell.filled {
  border-color: var(--text-mid);
}
.cell.g,
.key.g {
  background: oklch(58% 0.15 150);
  border-color: transparent;
  color: white;
}
.cell.y,
.key.y {
  background: oklch(72% 0.15 85);
  border-color: transparent;
  color: oklch(20% 0.02 250);
}
.cell.b,
.key.b {
  background: oklch(50% 0.01 250);
  border-color: transparent;
  color: white;
}
.kbd {
  display: grid;
  gap: 6px;
  user-select: none;
}
.krow {
  display: flex;
  gap: 4px;
  justify-content: center;
}
.key {
  flex: 1;
  max-width: 44px;
  min-height: 48px;
  border-radius: var(--r-sm);
  border: 1px solid var(--line);
  background: var(--surface-hi);
  font-size: 18px;
  font-weight: 800;
  color: var(--text-hi);
  padding: 0;
}
.key.wide {
  max-width: 140px;
  font-size: 15px;
}
.key.enter {
  background: var(--accent);
  color: var(--on-accent);
}
.emoji {
  font-size: 64px;
  line-height: 1.2;
  margin-top: var(--sp-3);
  animation: pop 600ms var(--ease) both;
}
@keyframes pop {
  0% {
    transform: scale(0) rotate(-20deg);
  }
  70% {
    transform: scale(1.25) rotate(6deg);
  }
}
.line {
  margin: var(--sp-1) 0;
  color: var(--text-hi);
}
.end .win {
  font-size: 20px;
  font-weight: 800;
  color: var(--success);
}
.answer {
  font-size: 24px;
  color: var(--accent);
}
.ach {
  color: var(--accent);
  font-weight: 700;
}
.row-btns {
  display: flex;
  gap: var(--sp-3);
  justify-content: center;
  flex-wrap: wrap;
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
</style>
