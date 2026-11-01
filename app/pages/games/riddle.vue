<script setup lang="ts">
import { fa } from '~/i18n/fa'
import { RD, hintRemovals, riddleDelta, type RiddleRound } from '~~/shared/games/riddle'

const hinted = ref(false)
const removed = ref<string[]>([])

const g = useRoundGame<RiddleRound>({
  gameId: 'riddle',
  seconds: () => RD.seconds,
  judge: (r, c) => c === r.answer,
  delta: (ok, left) => riddleDelta(ok, left, hinted.value),
  revealMs: 1000
})
const T = fa.games.riddle!

// هر دور تازه، راهنما از نو
watch(g.idx, () => {
  hinted.value = false
  removed.value = []
})

function useHint() {
  if (!g.round.value || hinted.value) return
  hinted.value = true
  removed.value = hintRemovals(g.round.value)
}

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
      :error="g.loadError.value"
      @difficulty="g.setDifficulty"
      @start="g.start"
    />

    <div v-else-if="g.phase.value === 'countdown'" class="card game-pad game-count">{{ toFa(g.count.value) }}</div>

    <div v-else-if="g.phase.value === 'playing' && g.round.value" class="card game-pad game-play" :class="g.flashState.value">
      <GameHud :score="g.score.value" :progress="`${toFa(g.idx.value + 1)}/${toFa(g.rounds.value.length)}`" :time="g.secondsLeft.value" />
      <GameTimer :left="g.secondsLeft.value" :total="RD.seconds" />
      <p class="q">❓ {{ g.round.value.q }}</p>
      <div class="opt-grid">
        <button
          v-for="o in g.round.value.options"
          :key="o"
          class="opt-btn"
          :class="optClass(o)"
          :disabled="removed.includes(o) || !!g.revealed.value"
          @click="g.answer(o)"
        >
          {{ removed.includes(o) ? '—' : o }}
        </button>
      </div>
      <button class="btn hint" :disabled="hinted || !!g.revealed.value" @click="useHint">💡 {{ T.hint }}</button>
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
  font-size: clamp(19px, 4.5vw, 24px);
  font-weight: 800;
  color: var(--text-hi);
  margin: var(--sp-5) 0;
  line-height: 2;
}
.hint {
  margin-top: var(--sp-4);
}
</style>
