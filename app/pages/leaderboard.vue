<script setup lang="ts">
import { fa } from '~/i18n/fa'
import { GAME_IDS } from '~~/shared/validation'
import { PERIODS } from '~~/shared/periods'

interface Row {
  rank: number
  userId: string
  displayName: string
  score: number
  games: number
  uniqueGames?: number
}

const gameId = ref<string>('all')
const period = ref<string>('week')
const rows = ref<Row[]>([])
const meId = ref<string | null>(null)
const loading = ref(false)
const error = ref('')

const tabs = [
  { id: 'all', label: fa.leaderboard.all },
  ...GAME_IDS.map((id) => ({ id: id as string, label: fa.games[id]!.name })),
  { id: 'mix', label: fa.leaderboard.mix }
]

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await $fetch<{ rows: Row[]; meId: string | null }>('/api/leaderboard', {
      query: { gameId: gameId.value, period: period.value }
    })
    rows.value = res.rows
    meId.value = res.meId
  } catch {
    error.value = fa.leaderboard.loadFailed
    rows.value = []
  } finally {
    loading.value = false
  }
}

watch([gameId, period], load)
onMounted(load)
</script>

<template>
  <div>
    <h1>{{ fa.leaderboard.title }}</h1>

    <div class="periods" role="tablist" aria-label="بازه زمانی">
      <button
        v-for="p in PERIODS"
        :key="p"
        role="tab"
        :aria-selected="period === p"
        class="chip"
        :class="{ on: period === p }"
        @click="period = p"
      >
        {{ fa.leaderboard.periods[p] }}
      </button>
    </div>
    <div class="games" role="tablist" aria-label="بازی">
      <button
        v-for="t in tabs"
        :key="t.id"
        role="tab"
        :aria-selected="gameId === t.id"
        class="chip"
        :class="{ on: gameId === t.id }"
        @click="gameId = t.id"
      >
        {{ t.label }}
      </button>
    </div>

    <p v-if="error" class="error" role="alert">{{ error }}</p>

    <div class="card scroll">
      <table>
        <thead>
          <tr>
            <th>{{ fa.leaderboard.rank }}</th>
            <th>{{ fa.leaderboard.player }}</th>
            <th>{{ fa.leaderboard.score }}</th>
            <th>{{ fa.leaderboard.games }}</th>
            <th v-if="gameId === 'all'">{{ fa.leaderboard.unique }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rows" :key="r.userId" :class="{ me: r.userId === meId }">
            <td class="rank">{{ r.rank <= 3 ? ['🥇', '🥈', '🥉'][r.rank - 1] : toFa(r.rank) }}</td>
            <td>
              {{ r.displayName }}<span v-if="r.userId === meId" class="you"> ({{ fa.leaderboard.you }})</span>
            </td>
            <td>
              <b>{{ toFa(r.score) }}</b>
            </td>
            <td>{{ toFa(r.games) }}</td>
            <td v-if="gameId === 'all'">{{ toFa(r.uniqueGames ?? 0) }}</td>
          </tr>
          <tr v-if="!rows.length && !loading">
            <td :colspan="gameId === 'all' ? 5 : 4" class="empty">{{ fa.leaderboard.empty }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
h1 {
  color: var(--text-hi);
}
.periods,
.games {
  display: flex;
  gap: var(--sp-2);
  flex-wrap: wrap;
  margin-bottom: var(--sp-3);
}
.games {
  overflow-x: auto;
  flex-wrap: nowrap;
  padding-bottom: var(--sp-2);
}
.chip {
  min-height: 44px;
  padding: 0 var(--sp-4);
  border-radius: 50px;
  border: 1px solid var(--line);
  background: var(--surface-hi);
  white-space: nowrap;
}
.chip.on {
  background: var(--accent);
  color: var(--on-accent);
  border-color: transparent;
  font-weight: 700;
}
.scroll {
  overflow: auto;
  max-height: 70vh;
  margin-top: var(--sp-3);
}
table {
  width: 100%;
  border-collapse: collapse;
}
th {
  position: sticky;
  top: 0;
  background: var(--surface-hi);
  text-align: start;
  padding: var(--sp-3) var(--sp-4);
  color: var(--text-mid);
  font-weight: 700;
}
td {
  padding: var(--sp-3) var(--sp-4);
  border-top: 1px solid var(--line);
}
.rank {
  width: 64px;
  font-size: 18px;
}
tr.me td {
  background: var(--accent-soft);
}
.you {
  color: var(--accent);
  font-size: 13px;
}
.empty {
  text-align: center;
  color: var(--text-mid);
  padding: var(--sp-6);
}
</style>
