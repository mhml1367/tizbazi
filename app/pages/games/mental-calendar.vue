<script setup lang="ts">
import { fa } from '~/i18n/fa'
import { CAL, calendarDelta, generateQuestion, type CalendarQuestion, type Today } from '~~/shared/games/calendar'
import { jalaliParts } from '~~/shared/periods'

/** امروز به وقت تهران: ماه و روز شمسی و روز هفته (شنبه = ۰) */
function today(): Today {
  const { month, day } = jalaliParts()
  const wd = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Tehran', weekday: 'short' }).format(new Date())
  return { m: month, d: day, weekday: (['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(wd) + 1) % 7 }
}

const g = useRoundGame<CalendarQuestion>({
  gameId: 'mental-calendar',
  seconds: (d) => CAL.seconds[d],
  judge: (r, c) => c === r.answer,
  delta: calendarDelta,
  build: (d) => {
    const t = today()
    return Array.from({ length: CAL.questions }, () => generateQuestion(d, t))
  },
  revealMs: 900
})
const T = fa.games['mental-calendar']!

const optClass = (o: string) => {
  const r = g.revealed.value
  if (!r || !g.round.value) return ''
  if (o === g.round.value.answer) return 'right'
  return r.choice === o ? 'wrong' : ''
}
</script>

<template>
  <div class="game-wrap">
    <GameIntro
      v-if="g.phase.value === 'idle'"
      :name="T.name"
      :desc="T.desc"
      :difficulty="g.difficulty.value"
      @difficulty="g.setDifficulty"
      @start="g.start"
    />

    <div v-else-if="g.phase.value === 'countdown'" class="card game-pad game-count">{{ toFa(g.count.value) }}</div>

    <div v-else-if="g.phase.value === 'playing' && g.round.value" class="card game-pad game-play" :class="g.flashState.value">
      <GameHud :score="g.score.value" :progress="`${toFa(g.idx.value + 1)}/${toFa(g.rounds.value.length)}`" :time="g.secondsLeft.value" />
      <GameTimer :left="g.secondsLeft.value" :total="CAL.seconds[g.difficulty.value]" />
      <p class="q">📅 {{ g.round.value.text }}</p>
      <div class="opt-grid">
        <button
          v-for="o in g.round.value.options"
          :key="o"
          class="opt-btn"
          :class="optClass(o)"
          :disabled="!!g.revealed.value"
          @click="g.answer(o)"
        >
          {{ o }}
        </button>
      </div>
    </div>

    <GameResult
      v-else
      :score="g.score.value"
      :accuracy="g.accuracy.value"
      :save-state="g.saveState.value"
      :reward="g.reward.value"
      :good="80"
      :great="150"
      @again="g.start"
    />
  </div>
</template>

<style scoped>
.q {
  font-size: clamp(18px, 4.5vw, 22px);
  font-weight: 800;
  color: var(--text-hi);
  margin: var(--sp-5) 0;
  line-height: 2;
}
</style>
