<script setup lang="ts">
import { fa } from '~/i18n/fa'
import { MS, moshaereDelta, type MoshaereRound } from '~~/shared/games/mosha-ere'

const g = useRoundGame<MoshaereRound>({
  gameId: 'mosha-ere',
  seconds: (d) => MS.seconds[d],
  judge: (r, c) => c === r.answerIndex,
  delta: moshaereDelta,
  revealMs: 1200
})
const T = fa.games['mosha-ere']!

const optClass = (i: number) => {
  const r = g.revealed.value
  if (!r || !g.round.value) return ''
  if (i === g.round.value.answerIndex) return 'right'
  return r.choice === i ? 'wrong' : ''
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
      <GameTimer :left="g.secondsLeft.value" :total="MS.seconds[g.difficulty.value]" />

      <blockquote class="prev">
        <p>{{ g.round.value.current.m1 }}</p>
        <p>{{ g.round.value.current.m2 }}</p>
        <cite>— {{ g.round.value.current.poet }}</cite>
      </blockquote>

      <div class="link" aria-hidden="true">
        <span class="line" />
        <span class="muted">{{ T.ask }}</span>
        <b class="letter">{{ g.round.value.letter }}</b>
        <span class="line" />
      </div>

      <blockquote class="verse">
        <p>{{ g.round.value.next.m1 }}</p>
        <p class="blank" :class="{ filled: g.revealed.value }">{{ g.revealed.value ? g.round.value.next.m2 : '؟' }}</p>
        <cite v-if="g.revealed.value">— {{ g.round.value.next.poet }}</cite>
      </blockquote>

      <p class="muted ask">{{ T.complete }}</p>
      <div class="opt-grid single">
        <button
          v-for="(o, i) in g.round.value.options"
          :key="i"
          class="opt-btn opt"
          :class="optClass(i)"
          :disabled="!!g.revealed.value"
          @click="g.answer(i)"
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
      :great="140"
      @again="g.start"
    />
  </div>
</template>

<style scoped>
.prev {
  margin: var(--sp-3) 0 0;
  padding: var(--sp-2) var(--sp-3);
  font-size: 15px;
  color: var(--text-mid);
  line-height: 1.9;
  text-align: center;
}
.prev p {
  margin: 0;
}
.prev cite {
  font-size: 12px;
  font-style: normal;
}
.link {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  margin: var(--sp-2) 0;
  font-size: 14px;
}
.link .line {
  flex: 1;
  height: 1px;
  background: var(--line);
}
.blank {
  min-height: 1.8em;
  border-bottom: 2px dashed var(--accent);
  color: var(--accent);
}
.blank.filled {
  border-bottom-color: transparent;
  color: var(--text-hi);
}
.ask {
  text-align: center;
  margin: 0 0 var(--sp-2);
}
.verse {
  margin: var(--sp-2) 0 var(--sp-3);
  text-align: center;
  padding: var(--sp-4);
  border-radius: var(--r-md);
  background: var(--accent-soft);
  font-size: clamp(17px, 4vw, 21px);
  font-weight: 700;
  color: var(--text-hi);
  line-height: 2.1;
}
.verse p {
  margin: 0;
}
.verse cite {
  display: block;
  font-size: 13px;
  font-style: normal;
  color: var(--text-mid);
}
.letter {
  display: inline-grid;
  place-items: center;
  min-width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--accent);
  color: var(--on-accent);
  font-size: 22px;
}
.opt {
  font-size: 16px;
  font-weight: 700;
  text-align: center;
}
</style>
