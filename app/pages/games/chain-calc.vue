<script setup lang="ts">
import { fa } from '~/i18n/fa'
import { CC_LIMITS, chainScore, chainText, generateChain, type Chain } from '~~/shared/games/chain-calc'

const { phase, difficulty, count, saveState, reward, setDifficulty, countdown, finish } = useGameFlow('chain-calc')

const chain = ref<Chain | null>(null)
const idx = ref(0)
const input = ref('')
const score = ref(0)
const correct = ref(0)
const secondsLeft = ref(CC_LIMITS.secondsPerChain)
const flash = ref<'good' | 'bad' | ''>('')
const inputEl = ref<HTMLInputElement | null>(null)

let chainStart = 0
let gameStart = 0
let ticker: ReturnType<typeof setInterval> | undefined
onBeforeUnmount(() => clearInterval(ticker))

const accuracy = computed(() => Math.round((correct.value / CC_LIMITS.chains) * 1000) / 10)
const text = computed(() => (chain.value ? chainText(chain.value).replace(/\d+/g, (n) => toFa(n)) : ''))

function start() {
  idx.value = 0
  score.value = correct.value = 0
  countdown(() => {
    gameStart = Date.now()
    next()
    ticker = setInterval(() => {
      const left = CC_LIMITS.secondsPerChain - (Date.now() - chainStart) / 1000
      secondsLeft.value = Math.max(0, left)
      if (left <= 0) submit(true)
    }, 200)
  })
}

function next() {
  chain.value = generateChain(difficulty.value)
  input.value = ''
  chainStart = Date.now()
  secondsLeft.value = CC_LIMITS.secondsPerChain
  nextTick(() => inputEl.value?.focus())
}

// ارقام فارسی/عربی را به لاتین تبدیل می‌کنیم تا کاربر با هر صفحه‌کلیدی بتواند جواب بدهد
const toEn = (s: string) =>
  s.replace(/[۰-۹]/g, (c) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c))).replace(/[٠-٩]/g, (c) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(c)))

function submit(timeout = false) {
  if (phase.value !== 'playing' || !chain.value) return
  const ok = !timeout && toEn(input.value).trim() !== '' && Number(toEn(input.value)) === chain.value.answer
  if (ok) {
    correct.value++
    score.value += chainScore(true, secondsLeft.value)
  }
  flash.value = ok ? 'good' : 'bad'
  setTimeout(() => (flash.value = ''), 300)
  if (++idx.value >= CC_LIMITS.chains) return end()
  next()
}

function end() {
  clearInterval(ticker)
  finish({ rawScore: score.value, accuracy: accuracy.value, duration: Date.now() - gameStart })
}
</script>

<template>
  <div class="wrap">
    <GameIntro
      v-if="phase === 'idle'"
      :name="fa.games['chain-calc']!.name"
      :desc="fa.games['chain-calc']!.desc"
      :difficulty="difficulty"
      @difficulty="setDifficulty"
      @start="start"
    />

    <div v-else-if="phase === 'countdown'" class="card pad count">{{ toFa(count) }}</div>

    <div v-else-if="phase === 'playing' && chain" class="card pad" :class="['play', flash]">
      <GameHud :score="score" :progress="`${toFa(idx + 1)}/${toFa(CC_LIMITS.chains)}`" :time="secondsLeft" />
      <p class="note">{{ fa.games['chain-calc']!.note }}</p>
      <div class="expr" dir="ltr">{{ text }} = ؟</div>
      <form class="answer" @submit.prevent="submit()">
        <input ref="inputEl" v-model="input" class="input" inputmode="numeric" autocomplete="off" aria-label="پاسخ" dir="ltr" />
        <button class="btn btn-primary">{{ fa.common.submit }}</button>
      </form>
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
.note {
  color: var(--text-mid);
  font-size: 14px;
}
.expr {
  font-size: clamp(28px, 8vw, 44px);
  font-weight: 900;
  color: var(--text-hi);
  margin: var(--sp-5) 0;
  word-spacing: 0.15em;
}
.answer {
  display: flex;
  gap: var(--sp-3);
}
.input {
  font-size: 24px;
  text-align: center;
}
</style>
