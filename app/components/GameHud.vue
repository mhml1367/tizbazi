<script setup lang="ts">
import { fa } from '~/i18n/fa'

defineProps<{ score: number; progress?: string; time?: number }>()
</script>

<template>
  <div class="hud">
    <span
      >{{ fa.common.score }}: <b>{{ toFa(score) }}</b></span
    >
    <span v-if="progress">{{ progress }}</span>
    <span v-if="time !== undefined">⏱ {{ toFa(Math.ceil(time)) }}</span>
  </div>
</template>

<style scoped>
.hud {
  display: flex;
  justify-content: space-between;
  color: var(--text-mid);
}
</style>
