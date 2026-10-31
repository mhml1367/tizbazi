<script setup lang="ts">
import { fa } from '~/i18n/fa'

interface Xp {
  totalXp: number
  level: number
  levelStartXp: number
  nextLevelXp: number
  progress: number
}
interface Streak {
  current: number
  longest: number
  playedToday: boolean
}
interface Ach {
  id: string
  title: string
  description: string
  unlocked: boolean
}
interface Daily {
  games: { gameId: string; done: boolean }[]
  allDone: boolean
  badgeXp: number
  allBonusXp: number
}
interface Score {
  id: string
  gameId: string
  rawScore: number
  accuracy: number
  difficulty: number
  createdAt: string
}

const { user, refresh, loaded } = useAuth()
const xp = ref<Xp | null>(null)
const streak = ref<Streak | null>(null)
const achievements = ref<Ach[]>([])
const daily = ref<Daily | null>(null)
const scores = ref<Score[]>([])
const error = ref('')

// تاریخ و ساعت شمسی به وقت تهران
const when = (iso: string) =>
  new Intl.DateTimeFormat('fa-IR-u-ca-persian', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Tehran' }).format(new Date(iso))

onMounted(async () => {
  if (!loaded.value) await refresh()
  if (!user.value) return navigateTo('/login?next=/dashboard')
  try {
    // streak/check اول اجرا می‌شود تا نمایش با فاصلهٔ روزها همخوان باشد
    await $fetch('/api/gamification/streak/check', { method: 'POST' })
    const [a, b, c, d, e] = await Promise.all([
      $fetch<Xp>('/api/gamification/xp'),
      $fetch<Streak>('/api/gamification/streak'),
      $fetch<{ achievements: Ach[] }>('/api/gamification/achievements'),
      $fetch<Daily>('/api/gamification/daily'),
      $fetch<{ scores: Score[] }>('/api/scores/me')
    ])
    xp.value = a
    streak.value = b
    achievements.value = c.achievements
    daily.value = d
    scores.value = e.scores.slice(0, 10)
  } catch {
    error.value = 'بارگذاری داشبورد انجام نشد'
  }
})
</script>

<template>
  <div v-if="user">
    <h1>{{ fa.dashboard.title }}</h1>
    <p v-if="error" class="error" role="alert">{{ error }}</p>

    <div v-if="xp && streak" class="top">
      <section class="card box">
        <div class="lvl">
          <span>{{ fa.dashboard.level }}</span
          ><b>{{ toFa(xp.level) }}</b>
        </div>
        <div class="bar" role="progressbar" :aria-valuenow="Math.round(xp.progress * 100)" aria-valuemin="0" aria-valuemax="100">
          <div :style="{ width: `${Math.round(xp.progress * 100)}%` }" />
        </div>
        <small
          >{{ toFa(xp.totalXp) }} / {{ toFa(xp.nextLevelXp) }} {{ fa.common.xp }} — {{ toFa(xp.nextLevelXp - xp.totalXp) }}
          {{ fa.dashboard.xpToNext }}</small
        >
      </section>
      <section class="card box streak">
        <div class="flame" :class="{ off: streak.current === 0 }">🔥</div>
        <div>
          <b class="n">{{ toFa(streak.current) }}</b> {{ fa.dashboard.streak }}
        </div>
        <small>{{ fa.dashboard.longest }}: {{ toFa(streak.longest) }}</small>
      </section>
    </div>

    <section v-if="daily" class="card box">
      <h2>🎯 {{ fa.dashboard.daily }}</h2>
      <p class="hint">
        {{
          daily.allDone
            ? fa.dashboard.allDone
            : `${fa.dashboard.dailyHint} (+${toFa(daily.badgeXp)} / +${toFa(daily.allBonusXp)} ${fa.common.xp})`
        }}
      </p>
      <div class="daily">
        <NuxtLink v-for="g in daily.games" :key="g.gameId" :to="`/games/${g.gameId}`" class="d" :class="{ done: g.done }">
          <span>{{ fa.games[g.gameId]!.name }}</span>
          <small>{{ g.done ? `✓ ${fa.dashboard.done}` : fa.dashboard.play }}</small>
        </NuxtLink>
      </div>
    </section>

    <section class="card box">
      <h2>🏅 {{ fa.dashboard.achievements }}</h2>
      <div class="achs">
        <div v-for="a in achievements" :key="a.id" class="ach" :class="{ locked: !a.unlocked }" :title="a.description">
          <span class="ic">{{ a.unlocked ? '🏅' : '🔒' }}</span>
          <b>{{ a.title }}</b>
          <small>{{ a.description }}</small>
        </div>
      </div>
    </section>

    <section class="card box">
      <h2>{{ fa.dashboard.recent }}</h2>
      <p v-if="!scores.length" class="hint">{{ fa.dashboard.noScores }}</p>
      <div v-else class="scroll">
        <table>
          <thead>
            <tr>
              <th>بازی</th>
              <th>{{ fa.common.score }}</th>
              <th>{{ fa.common.accuracy }}</th>
              <th>{{ fa.dashboard.difficulty }}</th>
              <th>{{ fa.dashboard.when }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in scores" :key="s.id">
              <td>{{ fa.games[s.gameId]?.name ?? s.gameId }}</td>
              <td>
                <b>{{ toFa(s.rawScore) }}</b>
              </td>
              <td>{{ toFa(s.accuracy) }}٪</td>
              <td>{{ fa.difficulty[s.difficulty] }}</td>
              <td>{{ when(s.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<style scoped>
h1,
h2 {
  color: var(--text-hi);
}
h2 {
  margin-top: 0;
  font-size: 18px;
}
.top {
  display: grid;
  gap: var(--sp-4);
  grid-template-columns: 2fr 1fr;
  margin-bottom: var(--sp-4);
}
@media (max-width: 600px) {
  .top {
    grid-template-columns: 1fr;
  }
}
.box {
  padding: var(--sp-5);
  margin-bottom: var(--sp-4);
}
.top .box {
  margin-bottom: 0;
}
.lvl {
  display: flex;
  align-items: baseline;
  gap: var(--sp-2);
}
.lvl b {
  font-size: 40px;
  color: var(--accent);
}
.bar {
  height: 10px;
  border-radius: 50px;
  background: var(--surface-hi);
  overflow: hidden;
  margin: var(--sp-3) 0;
}
.bar div {
  height: 100%;
  background: var(--accent);
  transition: width 400ms var(--ease);
}
small,
.hint {
  color: var(--text-mid);
}
.streak {
  text-align: center;
}
.flame {
  font-size: 40px;
}
.flame.off {
  filter: grayscale(1);
  opacity: 0.5;
}
.n {
  font-size: 32px;
  color: var(--accent);
}
.daily {
  display: grid;
  gap: var(--sp-3);
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
}
.d {
  display: grid;
  gap: var(--sp-1);
  padding: var(--sp-4);
  border-radius: var(--r-md);
  border: 1px solid var(--line);
  background: var(--surface-hi);
  text-decoration: none;
  color: var(--text-hi);
  font-weight: 700;
}
.d:hover {
  border-color: var(--accent);
}
.d.done {
  border-color: var(--success);
  background: var(--accent-soft);
}
.achs {
  display: grid;
  gap: var(--sp-3);
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
}
.ach {
  display: grid;
  gap: var(--sp-1);
  padding: var(--sp-3);
  border-radius: var(--r-md);
  border: 1px solid var(--accent);
  background: var(--accent-soft);
}
.ach.locked {
  border-color: var(--line);
  background: transparent;
  opacity: 0.6;
}
.ic {
  font-size: 24px;
}
.scroll {
  overflow-x: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th {
  text-align: start;
  color: var(--text-mid);
  padding: var(--sp-2) var(--sp-3);
}
td {
  padding: var(--sp-2) var(--sp-3);
  border-top: 1px solid var(--line);
  white-space: nowrap;
}
</style>
