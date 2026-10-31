<script setup lang="ts">
import { fa } from '~/i18n/fa'
import { OD, oddDelta, type OddRound } from '~~/shared/games/rounds'

const g = useRoundGame<OddRound>({
  gameId: 'odd-one-out',
  seconds: () => OD.secondsPerRound,
  judge: (r, c) => c === r.oddIndex,
  delta: oddDelta
})
</script>

<template>
  <div class="wrap">
    <GameIntro
      v-if="g.phase.value === 'idle'"
      :name="fa.games['odd-one-out']!.name"
      :desc="fa.games['odd-one-out']!.desc"
      :difficulty="g.difficulty.value"
      :error="g.loadError.value"
      @difficulty="g.setDifficulty"
      @start="g.start"
    />

    <div v-else-if="g.phase.value === 'countdown'" class="card pad count">{{ toFa(g.count.value) }}</div>

    <div v-else-if="g.phase.value === 'playing' && g.round.value" class="card pad" :class="['play', g.flashState.value]">
      <GameHud :score="g.score.value" :progress="`${toFa(g.idx.value + 1)}/${toFa(g.rounds.value.length)}`" :time="g.secondsLeft.value" />
      <GameTimer :left="g.secondsLeft.value" :total="OD.secondsPerRound" />
      <p class="ask">{{ fa.games['odd-one-out']!.ask }}</p>
      <div class="opts">
        <button v-for="(w, i) in g.round.value.words" :key="i" class="opt" @click="g.answer(i)">{{ w }}</button>
      </div>
    </div>

    <GameResult
      v-else
      :score="g.score.value"
      :accuracy="g.accuracy.value"
      :save-state="g.saveState.value"
      :reward="g.reward.value"
      :good="80"
      :great="160"
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
.ask {
  color: var(--text-mid);
  margin: var(--sp-4) 0;
}
.opts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-3);
}
.opts .opt:last-child:nth-child(odd) {
  grid-column: 1 / -1;
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
