<script setup lang="ts">
import { fa } from '~/i18n/fa'
import { GAME_IDS } from '~~/shared/validation'

const icons: Record<string, string> = {
  stroop: '🌈',
  'missing-letter': '🔤',
  'chain-calc': '🧮',
  'quick-math': '⚡',
  'sequence-memory': '🔁',
  'quick-category': '🗂️',
  'synonym-antonym': '↔️',
  proverb: '📜',
  'odd-one-out': '🎯',
  'reverse-memory': '🔢'
}
const games = GAME_IDS.map((id) => ({ id, icon: icons[id]!, name: fa.games[id]!.name, desc: fa.games[id]!.desc }))

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

    <h2 class="sub">{{ fa.home.pickGame }}</h2>
    <div class="grid">
      <NuxtLink v-for="g in games" :key="g.id" :to="`/games/${g.id}`" class="card game">
        <span class="ic">{{ g.icon }}</span>
        <h3>{{ g.name }}</h3>
        <p>{{ g.desc }}</p>
      </NuxtLink>
    </div>
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
.grid {
  display: grid;
  gap: var(--sp-4);
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
}
.game {
  padding: var(--sp-5);
  text-decoration: none;
  color: inherit;
  transition: transform 200ms var(--ease);
}
.game:hover {
  transform: translateY(-4px);
  border-color: var(--accent);
}
.ic {
  font-size: 32px;
}
.game h3 {
  margin: var(--sp-2) 0 var(--sp-1);
  color: var(--text-hi);
}
.game p {
  margin: 0;
  font-size: 14px;
  color: var(--text-mid);
}
</style>
