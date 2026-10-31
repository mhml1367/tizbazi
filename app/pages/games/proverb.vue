<script setup lang="ts">
import { fa } from '~/i18n/fa'
import { PV, proverbDelta, type ProverbRound } from '~~/shared/games/rounds'

const g = useRoundGame<ProverbRound>({
  gameId: 'proverb',
  seconds: () => PV.secondsPerQuestion,
  judge: (r, c) => c === r.answer,
  delta: proverbDelta
})

// متن را دور جای خالی می‌شکنیم تا جای خالی برجسته نمایش داده شود
const parts = computed(() => (g.round.value ? g.round.value.text.split('___') : ['', '']))
</script>

<template>
  <div class="wrap">
    <GameIntro
      v-if="g.phase.value === 'idle'"
      :name="fa.games.proverb!.name"
      :desc="fa.games.proverb!.desc"
      :difficulty="g.difficulty.value"
      :error="g.loadError.value"
      @difficulty="g.setDifficulty"
      @start="g.start"
    />

    <div v-else-if="g.phase.value === 'countdown'" class="card pad count">{{ toFa(g.count.value) }}</div>

    <div v-else-if="g.phase.value === 'playing' && g.round.value" class="card pad" :class="['play', g.flashState.value]">
      <GameHud :score="g.score.value" :progress="`${toFa(g.idx.value + 1)}/${toFa(g.rounds.value.length)}`" :time="g.secondsLeft.value" />
      <GameTimer :left="g.secondsLeft.value" :total="PV.secondsPerQuestion" />
      <p class="text">{{ parts[0] }}<span class="blank">؟؟؟</span>{{ parts[1] }}</p>
      <div class="opts">
        <button v-for="o in g.round.value.options" :key="o" class="opt" @click="g.answer(o)">{{ o }}</button>
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
  max-width: 600px;
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
.text {
  font-size: clamp(22px, 5vw, 30px);
  font-weight: 800;
  color: var(--text-hi);
  line-height: 2.2;
  margin: var(--sp-5) 0;
}
.blank {
  display: inline-block;
  min-width: 80px;
  margin-inline: var(--sp-2);
  padding-inline: var(--sp-3);
  border-bottom: 3px solid var(--accent);
  background: var(--accent-soft);
  border-radius: var(--r-sm);
  color: var(--accent);
}
.opts {
  display: grid;
  grid-template-columns: 1fr 1fr;
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
