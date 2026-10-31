<script setup lang="ts">
import { fa } from '~/i18n/fa'
import { CATEGORY_LABELS, QC, categoryDelta, type CategoryRound } from '~~/shared/games/rounds'

const g = useRoundGame<CategoryRound>({
  gameId: 'quick-category',
  seconds: (d) => QC.secondsPerWord[d],
  totalSeconds: QC.totalSeconds,
  judge: (r, c) => c === r.category,
  delta: categoryDelta
})
</script>

<template>
  <div class="wrap">
    <GameIntro
      v-if="g.phase.value === 'idle'"
      :name="fa.games['quick-category']!.name"
      :desc="fa.games['quick-category']!.desc"
      :difficulty="g.difficulty.value"
      :error="g.loadError.value"
      @difficulty="g.setDifficulty"
      @start="g.start"
    />

    <div v-else-if="g.phase.value === 'countdown'" class="card pad count">{{ toFa(g.count.value) }}</div>

    <div v-else-if="g.phase.value === 'playing' && g.round.value" class="card pad" :class="['play', g.flashState.value]">
      <GameHud :score="g.score.value" :progress="`${toFa(g.idx.value + 1)}/${toFa(g.rounds.value.length)}`" :time="g.totalLeft.value" />
      <GameTimer :left="g.secondsLeft.value" :total="QC.secondsPerWord[g.difficulty.value]" />
      <div class="word">{{ g.round.value.word }}</div>
      <div class="opts">
        <button v-for="o in g.round.value.options" :key="o" class="opt" @click="g.answer(o)">{{ CATEGORY_LABELS[o] }}</button>
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
.word {
  font-size: clamp(40px, 12vw, 64px);
  font-weight: 900;
  color: var(--text-hi);
  margin: var(--sp-5) 0;
}
.opts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: var(--sp-3);
}
.opt {
  min-height: 56px;
  border-radius: var(--r-md);
  border: 1px solid var(--line);
  background: var(--surface-hi);
  color: var(--text-hi);
  font-size: 20px;
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
