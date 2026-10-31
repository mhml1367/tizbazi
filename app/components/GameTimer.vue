<script setup lang="ts">
defineProps<{ left: number; total: number }>()
</script>

<template>
  <div class="bar" role="progressbar" :aria-valuenow="Math.ceil(left)" aria-valuemin="0" :aria-valuemax="total">
    <div :class="{ low: left / total < 0.3 }" :style="{ width: `${Math.max(0, (left / total) * 100)}%` }" />
  </div>
</template>

<style scoped>
.bar {
  height: 6px;
  background: var(--surface-hi);
  border-radius: 50px;
  margin: var(--sp-3) 0;
  overflow: hidden;
}
.bar div {
  height: 100%;
  background: var(--accent);
  transition: width 200ms linear;
}
.bar div.low {
  background: var(--danger);
}
</style>
