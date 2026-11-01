<script setup lang="ts">
import { fa } from '~/i18n/fa'
import { BZ, bazaarDelta, fmt, generateQuestion, type BazaarQuestion } from '~~/shared/games/bazaar'

const g = useRoundGame<BazaarQuestion>({
  gameId: 'bazaar',
  seconds: (d) => BZ.seconds[d],
  judge: (r, c) => c === r.answer,
  delta: bazaarDelta,
  build: (d) => Array.from({ length: BZ.questions }, () => generateQuestion(d)),
  revealMs: 900
})
const T = fa.games.bazaar!

const optClass = (o: number) => {
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
      <GameTimer :left="g.secondsLeft.value" :total="BZ.seconds[g.difficulty.value]" />
      <p class="q">🛒 {{ g.round.value.text }}</p>
      <div class="opt-grid">
        <button
          v-for="o in g.round.value.options"
          :key="o"
          class="opt-btn"
          :class="optClass(o)"
          :disabled="!!g.revealed.value"
          @click="g.answer(o)"
        >
          {{ fmt(o) }} <small class="muted">{{ g.round.value.unit }}</small>
        </button>
      </div>
    </div>

    <GameResult
      v-else
      :score="g.score.value"
      :accuracy="g.accuracy.value"
      :save-state="g.saveState.value"
      :reward="g.reward.value"
      :good="100"
      :great="180"
      @again="g.start"
    />
  </div>
</template>

<style scoped>
.q {
  font-size: clamp(17px, 4vw, 20px);
  font-weight: 700;
  color: var(--text-hi);
  margin: var(--sp-4) 0 var(--sp-5);
  line-height: 2.1;
  text-align: start;
}
</style>
