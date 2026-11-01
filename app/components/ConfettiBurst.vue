<script setup lang="ts">
// کاغذرنگی برای رکورد و امتیاز عالی؛ فقط CSS، بدون کتابخانه
const props = withDefaults(defineProps<{ count?: number }>(), { count: 60 })

const colors = ['var(--c-red)', 'var(--c-blue)', 'var(--c-green)', 'var(--c-yellow)', 'var(--c-purple)', 'var(--c-orange)']
const pieces = Array.from({ length: props.count }, (_, i) => ({
  left: `${Math.random() * 100}%`,
  color: colors[i % colors.length],
  delay: `${Math.random() * 0.6}s`,
  duration: `${1.8 + Math.random() * 1.6}s`,
  drift: `${(Math.random() - 0.5) * 160}px`,
  spin: `${(Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 720)}deg`,
  shape: i % 3 === 0 ? 'round' : i % 3 === 1 ? 'strip' : ''
}))
</script>

<template>
  <div class="confetti" aria-hidden="true">
    <i
      v-for="(p, i) in pieces"
      :key="i"
      :class="p.shape"
      :style="{
        left: p.left,
        background: p.color,
        animationDelay: p.delay,
        animationDuration: p.duration,
        '--drift': p.drift,
        '--spin': p.spin
      }"
    />
  </div>
</template>

<style scoped>
.confetti {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 50;
}
i {
  position: absolute;
  top: -20px;
  width: 9px;
  height: 14px;
  border-radius: 2px;
  opacity: 0;
  animation: fall linear forwards;
}
i.round {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
i.strip {
  width: 5px;
  height: 18px;
}
@keyframes fall {
  0% {
    opacity: 1;
    transform: translate(0, 0) rotate(0);
  }
  85% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(var(--drift), 105vh) rotate(var(--spin));
  }
}
@media (prefers-reduced-motion: reduce) {
  .confetti {
    display: none;
  }
}
</style>
