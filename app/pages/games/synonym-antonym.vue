<script setup lang="ts">
import { fa } from '~/i18n/fa'
import { SA, pairDelta, type PairRound } from '~~/shared/games/rounds'

const g = useRoundGame<PairRound>({
  gameId: 'synonym-antonym',
  seconds: () => SA.secondsPerPair,
  judge: (r, c) => (c === 'antonym') === r.isAntonym,
  delta: pairDelta
})
</script>

<template>
  <div class="wrap">
    <GameIntro
      v-if="g.phase.value === 'idle'"
      :name="fa.games['synonym-antonym']!.name"
      :desc="fa.games['synonym-antonym']!.desc"
      :difficulty="g.difficulty.value"
      :error="g.loadError.value"
      @difficulty="g.setDifficulty"
      @start="g.start"
    />

    <div v-else-if="g.phase.value === 'countdown'" class="card pad count">{{ toFa(g.count.value) }}</div>

    <div v-else-if="g.phase.value === 'playing' && g.round.value" class="card pad" :class="['play', g.flashState.value]">
      <GameHud :score="g.score.value" :progress="`${toFa(g.idx.value + 1)}/${toFa(g.rounds.value.length)}`" />
      <GameTimer :left="g.secondsLeft.value" :total="SA.secondsPerPair" />
      <div class="pair">
        <span>{{ g.round.value.a }}</span>
        <span class="vs">؟</span>
        <span>{{ g.round.value.b }}</span>
      </div>
      <div class="opts">
        <button class="opt" @click="g.answer('antonym')">{{ fa.games['synonym-antonym']!.antonym }}</button>
        <button class="opt" @click="g.answer('synonym')">{{ fa.games['synonym-antonym']!.synonym }}</button>
      </div>
    </div>

    <GameResult
      v-else
      :score="g.score.value"
      :accuracy="g.accuracy.value"
      :save-state="g.saveState.value"
      :reward="g.reward.value"
      :good="40"
      :great="100"
      @again="g.start"
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
.pair {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-4);
  flex-wrap: wrap;
  font-size: clamp(28px, 8vw, 44px);
  font-weight: 900;
  color: var(--text-hi);
  margin: var(--sp-5) 0;
}
.vs {
  color: var(--accent);
}
.opts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-3);
}
.opt {
  min-height: 64px;
  border-radius: var(--r-md);
  border: 1px solid var(--line);
  background: var(--surface-hi);
  color: var(--text-hi);
  font-size: 22px;
  font-weight: 800;
  transition: transform 120ms var(--ease);
}
.opt:hover {
  transform: translateY(-2px);
  border-color: var(--accent);
}
.opt:active {
  transform: scale(0.95);
}
</style>
