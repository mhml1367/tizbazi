<script setup lang="ts">
import { fa } from '~/i18n/fa'
import { TIER_EMOJI, TIER_LINES, pickBySeed, resultTier } from '~~/shared/reaction'

const props = defineProps<{
  score: number
  accuracy: number
  saveState: 'idle' | 'saving' | 'saved' | 'failed'
  reward: any
  /** آستانهٔ امتیاز برای پیام «آفرین» و «عالی» */
  good: number
  great: number
}>()
defineEmits<{ (e: 'again'): void }>()

const { mix, nextGame, start: startMix } = useMix()
const gameName = (id: string) => fa.games[id]?.name ?? id

// واکنش به امتیاز: با رسیدن پاسخ سرور (رکورد قبلی) ممکن است به «رکورد» ارتقا پیدا کند
const tier = computed(() => resultTier(props.score, props.good, props.great, props.reward?.record))
const seed = Math.floor(Math.random() * 1000)
const emoji = computed(() => pickBySeed(TIER_EMOJI[tier.value], seed))
const line = computed(() => pickBySeed(TIER_LINES[tier.value], seed))
const celebrate = computed(() => tier.value === 'record' || tier.value === 'great')
const firstTime = computed(() => props.reward?.record && props.reward.record.prevBest === null && props.score > 0)

// شمارش امتیاز از صفر
const shown = ref(0)
onMounted(() => {
  const t0 = performance.now()
  const run = (t: number) => {
    const k = Math.min(1, (t - t0) / 900)
    shown.value = Math.round(props.score * (1 - (1 - k) ** 3))
    if (k < 1) requestAnimationFrame(run)
  }
  requestAnimationFrame(run)
})
</script>

<template>
  <div class="card result" :class="tier">
    <ConfettiBurst v-if="celebrate" :key="tier" :count="tier === 'record' ? 90 : 55" />
    <div class="emoji" :class="tier" aria-hidden="true">{{ emoji }}</div>
    <h2>{{ line }}</h2>
    <p v-if="tier === 'record' && reward?.record" class="rec">
      {{ fa.result.prev }}: {{ toFa(reward.record.prevBest) }} ← {{ fa.result.now }}: {{ toFa(score) }}
    </p>
    <p v-else-if="firstTime" class="rec">{{ fa.result.first }}</p>
    <div class="big-score">{{ toFa(shown) }}</div>
    <p>{{ fa.common.accuracy }}: {{ toFa(accuracy) }}٪</p>
    <p class="state" :class="saveState">
      {{
        saveState === 'saving'
          ? fa.common.saving
          : saveState === 'saved'
            ? fa.common.saved
            : saveState === 'failed'
              ? fa.common.saveFailed
              : ''
      }}
    </p>
    <template v-if="reward">
      <p>
        +{{ toFa(reward.xpGained) }} {{ fa.common.xp }} · {{ fa.common.level }} {{ toFa(reward.level) }} · 🔥 {{ toFa(reward.streak) }}
        {{ fa.common.streak }}
      </p>
      <p v-if="reward.daily?.badge" class="ach">
        🎯 {{ fa.dashboard.daily }}: {{ fa.dashboard.done }}{{ reward.daily.allDone ? ' · 🎁' : '' }}
      </p>
      <p v-for="a in reward.newAchievements" :key="a.id" class="ach">🏅 {{ fa.common.newAchievement }}: {{ a.title }}</p>
    </template>

    <div v-if="mix && saveState === 'saved'" class="mix">
      <template v-if="mix.total !== null">
        <strong>{{ fa.mix.done }}</strong>
        <div>
          {{ fa.mix.total }}: <b class="ms">{{ toFa(mix.total) }}</b>
        </div>
      </template>
      <div v-else-if="nextGame">
        {{ fa.mix.progress }}: {{ toFa(mix.index) }}/{{ toFa(mix.gameIds.length) }}
        <NuxtLink :to="`/games/${nextGame}`" class="btn btn-primary next">{{ fa.mix.next }}: {{ gameName(nextGame) }}</NuxtLink>
      </div>
    </div>

    <div class="row">
      <button class="btn" :class="{ 'btn-primary': !(mix && mix.total === null) }" @click="$emit('again')">{{ fa.common.again }}</button>
      <button v-if="mix && mix.total !== null" class="btn btn-primary" @click="startMix">{{ fa.mix.again }}</button>
      <NuxtLink to="/" class="btn link">{{ fa.common.back }}</NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.result {
  padding: var(--sp-5);
  text-align: center;
  position: relative;
  overflow: hidden;
}
/* رنگ لبهٔ کارت بسته به سطح واکنش */
.result.record {
  border-color: var(--c-yellow);
  box-shadow:
    0 0 0 2px var(--c-yellow),
    0 0 40px color-mix(in oklch, var(--c-yellow) 35%, transparent);
}
.result.great {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent);
}
h2 {
  margin: var(--sp-2) 0;
  color: var(--text-hi);
  font-size: 22px;
  font-weight: 900;
}
.emoji {
  font-size: 72px;
  line-height: 1.2;
  display: inline-block;
  animation: pop 600ms var(--ease) both;
}
.emoji.record,
.emoji.great {
  animation:
    pop 600ms var(--ease) both,
    wiggle 1.2s 600ms ease-in-out 2;
}
.emoji.low,
.emoji.zero {
  animation:
    pop 600ms var(--ease) both,
    bob 2s 600ms ease-in-out infinite;
}
@keyframes pop {
  0% {
    transform: scale(0) rotate(-20deg);
  }
  70% {
    transform: scale(1.25) rotate(6deg);
  }
  100% {
    transform: scale(1);
  }
}
@keyframes wiggle {
  25% {
    transform: rotate(-12deg) scale(1.1);
  }
  75% {
    transform: rotate(12deg) scale(1.1);
  }
}
@keyframes bob {
  50% {
    transform: translateY(-6px);
  }
}
.rec {
  margin: 0;
  font-weight: 700;
  color: var(--c-orange);
}
.big-score {
  font-size: 64px;
  font-weight: 900;
  color: var(--accent);
}
.record .big-score {
  color: var(--c-orange);
}
.state.failed {
  color: var(--danger);
}
.state.saved {
  color: var(--success);
}
.ach {
  color: var(--accent);
  font-weight: 700;
  margin: var(--sp-1) 0;
}
.mix {
  margin-top: var(--sp-4);
  padding: var(--sp-4);
  border: 1px dashed var(--accent);
  border-radius: var(--r-md);
  display: grid;
  gap: var(--sp-3);
  justify-items: center;
}
.ms {
  font-size: 28px;
  color: var(--accent);
}
.next {
  text-decoration: none;
  display: inline-flex;
  align-items: center;
}
.row {
  display: flex;
  gap: var(--sp-3);
  justify-content: center;
  margin-top: var(--sp-4);
  flex-wrap: wrap;
}
.link {
  text-decoration: none;
  display: inline-flex;
  align-items: center;
}
</style>
