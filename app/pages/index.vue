<script setup lang="ts">
import { fa } from '~/i18n/fa'
import { GAME_GROUPS } from '~~/shared/validation'

const groups = GAME_GROUPS.map((g) => ({
  id: g.id,
  title: fa.home.groups[g.id]!,
  games: g.games.map((id) => ({ id, name: fa.games[id]!.name, desc: fa.games[id]!.desc }))
}))

const { user } = useAuth()
const { start: startMix } = useMix()
const busy = ref(false)
const error = ref('')

// بازی تصادفی: ۳ تا ۵ بازی متمایز پشت‌سرهم؛ برای ثبت امتیاز لازم است کاربر (حتی مهمان) وارد شده باشد
async function onMix() {
  if (!user.value) return navigateTo('/login?next=/')
  busy.value = true
  error.value = ''
  try {
    await startMix()
  } catch {
    error.value = fa.mix.startFailed
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div>
    <section class="hero">
      <h1>{{ fa.brand }}</h1>
      <p>{{ fa.tagline }}</p>
      <button class="btn btn-primary mix" :disabled="busy" @click="onMix">⚡ {{ fa.home.randomMix }}</button>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
    </section>

    <section v-for="grp in groups" :key="grp.id" class="group">
      <h2 class="sub">{{ grp.title }}</h2>
      <div class="grid">
        <NuxtLink v-for="g in grp.games" :key="g.id" :to="`/games/${g.id}`" class="card game">
          <div class="thumb"><GameArt :game="g.id" /></div>
          <div class="body">
            <h3>{{ g.name }}</h3>
            <p>{{ g.desc }}</p>
          </div>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
.hero {
  text-align: center;
  padding-block: var(--sp-6);
}
.hero h1 {
  font-size: clamp(40px, 8vw, 64px);
  margin: 0;
  color: var(--text-hi);
  font-weight: 900;
}
.hero p {
  color: var(--text-mid);
  max-width: 460px;
  margin: var(--sp-3) auto var(--sp-5);
}
.mix {
  font-size: 20px;
  padding: var(--sp-3) var(--sp-7);
  border-radius: 50px;
}
.sub {
  color: var(--text-hi);
}
.group {
  margin-bottom: var(--sp-6);
}
.grid {
  display: grid;
  gap: var(--sp-4);
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
}
/* موبایل: دو ستون با کارت‌های جمع‌وجورتر */
@media (max-width: 560px) {
  .grid {
    grid-template-columns: 1fr 1fr;
    gap: var(--sp-3);
  }
  .body {
    padding: var(--sp-2) var(--sp-3) var(--sp-3);
  }
  .game h3 {
    font-size: 15px;
  }
  .game p {
    font-size: 12px;
  }
}
.game {
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;
  transition:
    transform 200ms var(--ease),
    border-color 200ms var(--ease);
}
.game:hover {
  transform: translateY(-4px);
  border-color: var(--accent);
}
.thumb {
  aspect-ratio: 5 / 3;
  overflow: hidden;
}
.thumb :deep(svg) {
  transition: transform 300ms var(--ease);
}
.game:hover .thumb :deep(svg) {
  transform: scale(1.06);
}
.body {
  padding: var(--sp-3) var(--sp-4) var(--sp-4);
}
.game h3 {
  margin: 0 0 var(--sp-1);
  color: var(--text-hi);
}
.game p {
  margin: 0;
  font-size: 14px;
  color: var(--text-mid);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
