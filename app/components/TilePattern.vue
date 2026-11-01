<script setup lang="ts">
import { TILE_COLORS, type TileShape } from '~~/shared/games/tiles'

// نقش‌های هندسی الهام‌گرفته از کاشی‌کاری ایرانی (ستاره، شمسه، گره، خاتم، …) که با SVG ساخته می‌شوند
const props = defineProps<{ shape: TileShape; color: number }>()

const C = 50 // مرکز در viewBox ۱۰۰×۱۰۰
const fill = computed(() => TILE_COLORS[props.color] ?? TILE_COLORS[0])

/** ستارهٔ n پر با شعاع بیرونی و درونی */
function star(n: number, ro: number, ri: number, rot = -90) {
  const pts: string[] = []
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? ri : ro
    const a = ((rot + (i * 180) / n) * Math.PI) / 180
    pts.push(`${(C + r * Math.cos(a)).toFixed(2)},${(C + r * Math.sin(a)).toFixed(2)}`)
  }
  return pts.join(' ')
}
/** چندضلعی منتظم */
function poly(n: number, r: number, rot = -90) {
  return Array.from({ length: n }, (_, i) => {
    const a = ((rot + (i * 360) / n) * Math.PI) / 180
    return `${(C + r * Math.cos(a)).toFixed(2)},${(C + r * Math.sin(a)).toFixed(2)}`
  }).join(' ')
}
const petals = (n: number) => Array.from({ length: n }, (_, i) => (i * 360) / n)
</script>

<template>
  <svg viewBox="0 0 100 100" class="tile" aria-hidden="true">
    <rect x="2" y="2" width="96" height="96" rx="10" class="bg" />
    <rect x="8" y="8" width="84" height="84" rx="6" fill="none" :stroke="fill" stroke-width="2" opacity="0.5" />
    <!-- ستارهٔ هشت‌پر -->
    <g v-if="shape === 'star8'">
      <polygon :points="star(8, 40, 18)" :fill="fill" />
      <circle :cx="C" :cy="C" r="9" class="core" />
    </g>
    <!-- ستارهٔ شش‌پر -->
    <g v-else-if="shape === 'star6'">
      <polygon :points="star(6, 40, 22)" :fill="fill" />
      <polygon :points="poly(6, 12)" class="core" />
    </g>
    <!-- شمسه (گل‌دایره) -->
    <g v-else-if="shape === 'rosette'">
      <circle
        v-for="a in petals(8)"
        :key="a"
        :cx="C + 22 * Math.cos((a * Math.PI) / 180)"
        :cy="C + 22 * Math.sin((a * Math.PI) / 180)"
        r="13"
        :fill="fill"
        opacity="0.85"
      />
      <circle :cx="C" :cy="C" r="12" class="core" />
    </g>
    <!-- گره ده‌تایی -->
    <g v-else-if="shape === 'girih'">
      <polygon :points="poly(10, 40)" :fill="fill" />
      <polygon :points="star(10, 30, 17)" class="core" />
    </g>
    <!-- لوزی‌های تودرتو -->
    <g v-else-if="shape === 'diamond'">
      <polygon :points="poly(4, 42)" :fill="fill" />
      <polygon :points="poly(4, 26)" class="core" />
      <polygon :points="poly(4, 12)" :fill="fill" />
    </g>
    <!-- گل اسلیمی -->
    <g v-else-if="shape === 'flower'">
      <ellipse v-for="a in petals(6)" :key="a" :cx="C" :cy="C - 20" rx="10" ry="20" :fill="fill" :transform="`rotate(${a} ${C} ${C})`" />
      <circle :cx="C" :cy="C" r="8" class="core" />
    </g>
    <!-- خاتم: دو مربع چرخیده -->
    <g v-else-if="shape === 'khatam'">
      <polygon :points="poly(4, 38, -45)" :fill="fill" opacity="0.9" />
      <polygon :points="poly(4, 38, 0)" :fill="fill" opacity="0.9" />
      <polygon :points="poly(8, 14, -22.5)" class="core" />
    </g>
    <!-- خورشید -->
    <g v-else>
      <polygon :points="star(16, 42, 28)" :fill="fill" />
      <circle :cx="C" :cy="C" r="20" class="core" />
      <circle :cx="C" :cy="C" r="10" :fill="fill" />
    </g>
  </svg>
</template>

<style scoped>
.tile {
  width: 100%;
  height: 100%;
  display: block;
}
.bg {
  fill: oklch(97% 0.01 85);
}
.core {
  fill: oklch(97% 0.01 85);
}
</style>
