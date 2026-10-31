<script setup lang="ts">
import { fa } from '~/i18n/fa'

// نکته: as const را در قالب ننویسید؛ Prettier پرانتزهای v-for را برمی‌دارد و پارسر Vue خطا می‌دهد
const difficulties = [1, 2, 3] as const

defineProps<{ name: string; desc: string; difficulty: 1 | 2 | 3; error?: string }>()
defineEmits<{ (e: 'difficulty', d: 1 | 2 | 3): void; (e: 'start'): void }>()
</script>

<template>
  <div class="card pad">
    <h1>{{ name }}</h1>
    <p>{{ desc }}</p>
    <div class="diff" role="group" aria-label="سختی">
      <button v-for="d in difficulties" :key="d" class="btn" :class="{ 'btn-primary': difficulty === d }" @click="$emit('difficulty', d)">
        {{ fa.difficulty[d] }}
      </button>
    </div>
    <slot />
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <button class="btn btn-primary big" @click="$emit('start')">{{ fa.common.play }}</button>
  </div>
</template>

<style scoped>
.pad {
  padding: var(--sp-5);
  text-align: center;
}
h1 {
  margin: 0 0 var(--sp-2);
  color: var(--text-hi);
}
.diff {
  display: flex;
  gap: var(--sp-2);
  justify-content: center;
  margin: var(--sp-4) 0;
  flex-wrap: wrap;
}
.big {
  font-size: 20px;
  padding-inline: var(--sp-7);
}
</style>
