<script setup lang="ts">
import { fa } from '~/i18n/fa'

const route = useRoute()
const { submit } = useAuth()
// نکته: عبارت‌های TypeScript (مثل as const) را داخل قالب نمی‌نویسیم؛ Prettier پرانتزهای v-for را برمی‌دارد و پارسر Vue خطا می‌دهد
const tabs = [
  { id: 'guest', label: fa.auth.guestTab },
  { id: 'login', label: fa.auth.loginTab },
  { id: 'register', label: fa.auth.registerTab }
] as const
const tab = ref<'guest' | 'login' | 'register'>('guest')
const form = reactive({ displayName: '', email: '', password: '' })
const error = ref('')
const busy = ref(false)

function selectTab(id: 'guest' | 'login' | 'register') {
  tab.value = id
  error.value = ''
}

async function onSubmit() {
  error.value = ''
  busy.value = true
  try {
    if (tab.value === 'guest') await submit('login', { displayName: form.displayName })
    else if (tab.value === 'login') await submit('login', { email: form.email, password: form.password })
    else await submit('register', { displayName: form.displayName, email: form.email || undefined, password: form.password })
    await navigateTo(typeof route.query.next === 'string' && route.query.next.startsWith('/') ? route.query.next : '/')
  } catch (e: any) {
    error.value = e?.data?.message || 'خطایی رخ داد'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="card box">
    <div class="tabs" role="tablist">
      <button v-for="t in tabs" :key="t.id" role="tab" :aria-selected="tab === t.id" :class="{ on: tab === t.id }" @click="selectTab(t.id)">
        {{ t.label }}
      </button>
    </div>
    <form @submit.prevent="onSubmit">
      <p v-if="tab === 'guest'" class="hint">{{ fa.auth.guestHint }}</p>
      <label v-if="tab !== 'login'"
        >{{ fa.auth.displayName }}
        <input v-model="form.displayName" class="input" required minlength="2" maxlength="20" autocomplete="nickname" />
      </label>
      <label v-if="tab !== 'guest'"
        >{{ tab === 'register' ? fa.auth.emailOptional : fa.auth.email }}
        <input v-model="form.email" class="input" type="email" :required="tab === 'login'" dir="ltr" autocomplete="email" />
      </label>
      <label v-if="tab !== 'guest'"
        >{{ fa.auth.password }}
        <input v-model="form.password" class="input" type="password" required minlength="6" dir="ltr" autocomplete="current-password" />
      </label>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <button class="btn btn-primary" :disabled="busy">{{ fa.auth.submit }}</button>
      <p class="hint">با ادامه، <NuxtLink to="/privacy">سیاست حریم خصوصی</NuxtLink> را می‌پذیری.</p>
    </form>
  </div>
</template>

<style scoped>
.box {
  max-width: 420px;
  margin: var(--sp-6) auto;
  padding: var(--sp-5);
}
.tabs {
  display: flex;
  gap: var(--sp-1);
  margin-bottom: var(--sp-4);
}
.tabs button {
  flex: 1;
  min-height: 44px;
  border: 1px solid var(--line);
  background: var(--surface-hi);
  border-radius: var(--r-sm);
}
.tabs button.on {
  background: var(--accent);
  color: var(--on-accent);
  border-color: transparent;
  font-weight: 700;
}
form {
  display: grid;
  gap: var(--sp-4);
}
label {
  display: grid;
  gap: var(--sp-1);
  font-size: 14px;
  color: var(--text-mid);
}
.hint {
  margin: 0;
  font-size: 14px;
  color: var(--text-mid);
}
</style>
