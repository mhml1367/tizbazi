<script setup lang="ts">
import { fa } from '~/i18n/fa'
import { MP, mapDelta, type MapData, type MapRound } from '~~/shared/games/iran-map'

const map = ref<MapData | null>(null)

const g = useRoundGame<MapRound>({
  gameId: 'iran-map',
  seconds: (d) => MP.seconds[d],
  // «پیدا کن» با اندیس استان جواب داده می‌شود؛ بقیه با متن گزینه
  judge: (r, c) => (r.kind === 'find' ? c === r.target : c === r.answer),
  delta: mapDelta,
  build: async (d) => {
    const res = await $fetch<{ rounds: MapRound[]; map: MapData }>('/api/games/rounds/iran-map', { query: { difficulty: d } })
    map.value = res.map
    return res.rounds
  },
  revealMs: 1100
})
const T = fa.games['iran-map']!

/** شکل هر استان به ترتیب فهرست استان‌ها (اندیس = اندیس استان در دورها) */
const shapes = computed(() => {
  if (!map.value) return null
  const byName = new Map(map.value.shapes.map((s) => [s.name, s.d]))
  return map.value.provinces.map((p) => byName.get(p.name) ?? '')
})

const prompt = computed(() => {
  const r = g.round.value
  if (!r || !map.value) return ''
  const p = map.value.provinces[r.target]!
  return r.kind === 'which' ? T.which : r.kind === 'find' ? `${T.find} «${p.name}»` : `${T.capital} «${p.name}»`
})

/** کدام استان رنگ بگیرد: در «کدام استان؟» و «مرکز؟» هدف؛ هنگام نمایش جواب، جواب درست (و انتخاب غلط) */
const shapeClass = (i: number) => {
  const r = g.round.value
  if (!r) return ''
  const rev = g.revealed.value
  if (rev && i === r.target) return 'right'
  if (rev && r.kind === 'find' && rev.choice === i) return 'wrong'
  if (r.kind !== 'find' && i === r.target) return 'target'
  return r.kind === 'find' && !rev ? 'clickable' : ''
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

    <div
      v-else-if="g.phase.value === 'playing' && g.round.value && shapes && map"
      class="card game-pad game-play"
      :class="g.flashState.value"
    >
      <GameHud :score="g.score.value" :progress="`${toFa(g.idx.value + 1)}/${toFa(g.rounds.value.length)}`" :time="g.secondsLeft.value" />
      <GameTimer :left="g.secondsLeft.value" :total="MP.seconds[g.difficulty.value]" />
      <p class="q">{{ prompt }}</p>

      <svg :viewBox="map.viewBox" class="map" role="img" aria-label="نقشهٔ ایران">
        <path
          v-for="(d, i) in shapes"
          :key="i"
          :d="d"
          class="prov"
          :class="shapeClass(i)"
          @click="g.round.value.kind === 'find' && !g.revealed.value && g.answer(i)"
        />
      </svg>

      <div v-if="g.round.value.kind !== 'find'" class="opt-grid">
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
      <p class="muted note">{{ T.note }}</p>
    </div>

    <GameResult
      v-else
      :score="g.score.value"
      :accuracy="g.accuracy.value"
      :save-state="g.saveState.value"
      :reward="g.reward.value"
      :good="100"
      :great="170"
      @again="g.start"
    />
  </div>
</template>

<style scoped>
.q {
  font-size: 20px;
  font-weight: 800;
  color: var(--text-hi);
}
.map {
  width: 100%;
  margin: var(--sp-3) 0;
}
.prov {
  fill: color-mix(in oklch, var(--accent) 16%, var(--surface-hi));
  stroke: var(--surface);
  stroke-width: 3;
  stroke-linejoin: round;
  transition: fill 150ms var(--ease);
}
.prov.clickable {
  cursor: pointer;
}
.prov.clickable:hover {
  fill: var(--accent-soft);
  stroke: var(--accent);
}
.prov.target {
  fill: var(--c-orange);
}
.prov.right {
  fill: var(--success);
}
.prov.wrong {
  fill: var(--danger);
}
.note {
  font-size: 12px;
  margin-top: var(--sp-3);
}
</style>
