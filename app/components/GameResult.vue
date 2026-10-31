<script setup lang="ts">
import { fa } from '~/i18n/fa'

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
const title = computed(() => (props.score >= props.great ? fa.result.great : props.score >= props.good ? fa.result.good : fa.result.keep))
const gameName = (id: string) => fa.games[id]?.name ?? id
</script>

<template>
  <div class="card pad">
    <h2>{{ title }}</h2>
    <div class="big-score">{{ toFa(score) }}</div>
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
.pad {
  padding: var(--sp-5);
  text-align: center;
}
.big-score {
  font-size: 64px;
  font-weight: 900;
  color: var(--accent);
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
