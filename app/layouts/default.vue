<script setup lang="ts">
import { fa } from '~/i18n/fa'

const { user, refresh, logout } = useAuth()
const route = useRoute()
const theme = ref<'light' | 'dark'>('light')

function applyTheme(t: 'light' | 'dark') {
  theme.value = t
  document.documentElement.dataset.theme = t
  try {
    localStorage.setItem('tiz_theme', t)
  } catch {
    /* نادیده */
  }
}

onMounted(async () => {
  let saved: string | null = null
  try {
    saved = localStorage.getItem('tiz_theme')
  } catch {
    /* نادیده */
  }
  applyTheme(saved === 'dark' || (!saved && matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light')
  await refresh()
})

async function onLogout() {
  await logout()
  await navigateTo('/')
}
</script>

<template>
  <div>
    <header class="top">
      <div class="container bar">
        <NuxtLink to="/" class="brand">{{ fa.brand }}</NuxtLink>
        <nav class="nav">
          <NuxtLink to="/dashboard">{{ fa.nav.dashboard }}</NuxtLink>
          <NuxtLink to="/leaderboard">{{ fa.nav.leaderboard }}</NuxtLink>
        </nav>
        <div class="side">
          <button
            class="icon"
            :aria-label="theme === 'dark' ? 'حالت روشن' : 'حالت تیره'"
            @click="applyTheme(theme === 'dark' ? 'light' : 'dark')"
          >
            {{ theme === 'dark' ? '☀️' : '🌙' }}
          </button>
          <template v-if="user">
            <span class="who">{{ user.displayName }}</span>
            <button class="btn" @click="onLogout">{{ fa.nav.logout }}</button>
          </template>
          <NuxtLink v-else to="/login" class="btn">{{ fa.nav.login }}</NuxtLink>
        </div>
      </div>
    </header>
    <main class="container main" :class="{ 'in-game': route.path.startsWith('/games/') }"><slot /></main>
    <footer v-if="!route.path.startsWith('/games/')" class="foot container">
      <NuxtLink to="/privacy">سیاست حریم خصوصی</NuxtLink>
    </footer>
  </div>
</template>

<style scoped>
.top {
  border-bottom: 1px solid var(--line);
  background: var(--surface);
  position: sticky;
  top: 0;
  z-index: 10;
  backdrop-filter: blur(8px);
}
.bar {
  display: flex;
  align-items: center;
  gap: var(--sp-4);
  min-height: 64px;
  flex-wrap: wrap;
}
.brand {
  font-weight: 900;
  font-size: 24px;
  color: var(--accent);
  text-decoration: none;
}
.nav {
  display: flex;
  gap: var(--sp-4);
  flex: 1;
}
.nav a {
  color: var(--text);
  text-decoration: none;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
}
.nav a.router-link-active {
  color: var(--accent);
  font-weight: 700;
}
.side {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}
.icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid var(--line);
  background: var(--surface-hi);
  font-size: 18px;
}
.who {
  color: var(--text-hi);
  font-weight: 700;
}
.side .btn {
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  padding-inline: var(--sp-4);
}
.main {
  padding-block: var(--sp-6);
  padding-bottom: calc(var(--sp-6) + env(safe-area-inset-bottom, 0px));
}
.top {
  padding-top: env(safe-area-inset-top, 0px);
}
.foot {
  text-align: center;
  padding-bottom: calc(var(--sp-5) + env(safe-area-inset-bottom, 0px));
  font-size: 14px;
}
.foot a {
  color: var(--text-mid);
}
/* موبایل: سربرگ در یک ردیف بماند */
@media (max-width: 560px) {
  .bar {
    gap: var(--sp-2);
    flex-wrap: nowrap;
    min-height: 56px;
  }
  .brand {
    font-size: 20px;
  }
  .nav {
    gap: var(--sp-3);
    font-size: 14px;
    min-width: 0;
  }
  .side {
    gap: var(--sp-1);
  }
  .icon {
    width: 40px;
    height: 40px;
    font-size: 16px;
  }
  .who {
    max-width: 64px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
  }
  .side .btn {
    padding-inline: var(--sp-3);
    font-size: 13px;
  }
  .main {
    padding-block: var(--sp-4);
    padding-bottom: calc(var(--sp-4) + env(safe-area-inset-bottom, 0px));
  }

  /* داخل بازی: کارتِ در حال بازی تا پایین صفحه کشیده شود و پایین گوشی خالی نماند */
  .main.in-game {
    min-height: calc(100dvh - 57px);
    display: flex;
    flex-direction: column;
  }
  .main.in-game > :deep(div) {
    flex: 1;
    display: flex;
    flex-direction: column;
    width: 100%;
  }
  .main.in-game > :deep(div) > .card {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  /* بازی‌های سؤال‌وجواب: نوار بالا ثابت، سؤال و گزینه‌ها به‌طور مساوی در بقیهٔ ارتفاع */
  .main.in-game > :deep(div) > .card:has(> .hud) {
    justify-content: flex-start;
  }
  .main.in-game > :deep(div) > .card:has(> .hud) > :not(.hud):not([role='progressbar']) {
    margin-block: auto;
  }
  .main.in-game :deep(.opt),
  .main.in-game :deep(.opt-btn) {
    min-height: 64px;
  }
}
</style>
