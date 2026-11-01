<script setup lang="ts">
// تصویر هر بازی: پس‌زمینهٔ گرادیان + نقش SVG مخصوص همان بازی (بدون فایل تصویری بیرونی)
const props = defineProps<{ game: string }>()

const BG: Record<string, [string, string]> = {
  stroop: ['#7c3aed', '#db2777'],
  'missing-letter': ['#0ea5e9', '#6366f1'],
  'chain-calc': ['#f59e0b', '#ef4444'],
  'quick-math': ['#facc15', '#f97316'],
  'sequence-memory': ['#14b8a6', '#2563eb'],
  'quick-category': ['#22c55e', '#0d9488'],
  'synonym-antonym': ['#f43f5e', '#8b5cf6'],
  proverb: ['#b45309', '#78350f'],
  'odd-one-out': ['#06b6d4', '#3b82f6'],
  'reverse-memory': ['#8b5cf6', '#1e40af'],
  'word-of-day': ['#16a34a', '#065f46'],
  'esm-famil': ['#fb923c', '#e11d48'],
  'mosha-ere': ['#be123c', '#581c87'],
  riddle: ['#4f46e5', '#0f172a'],
  morris: ['#a16207', '#422006'],
  'chess-puzzle': ['#334155', '#0f172a'],
  bazaar: ['#ea580c', '#9a3412'],
  'mental-calendar': ['#0891b2', '#155e75'],
  'iran-map': ['#059669', '#1e3a8a'],
  'tile-memory': ['#0369a1', '#0c4a6e'],
  'word-chain': ['#65a30d', '#166534'],
  'code-breaker': ['#1f2937', '#7c2d12']
}
const TILES = [
  { x: 52, y: 36, c: '#fde047' },
  { x: 100, y: 60, c: '#38bdf8' },
  { x: 148, y: 36, c: '#fde047' },
  { x: 52, y: 92, c: '#38bdf8' },
  { x: 148, y: 92, c: '#f472b6' }
]
const bg = computed(() => BG[props.game] ?? ['#0d9488', '#1e40af'])
const id = computed(() => `ga-${props.game}`)
</script>

<template>
  <svg viewBox="0 0 200 120" class="art" role="img" :aria-label="game" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient :id="id" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" :stop-color="bg[0]" />
        <stop offset="1" :stop-color="bg[1]" />
      </linearGradient>
    </defs>
    <rect width="200" height="120" :fill="`url(#${id})`" />
    <!-- دایره‌های نرم پس‌زمینه -->
    <circle cx="180" cy="10" r="40" fill="#fff" opacity=".08" />
    <circle cx="15" cy="115" r="35" fill="#fff" opacity=".06" />

    <!-- استروپ: نام رنگ با رنگ دیگر -->
    <g v-if="game === 'stroop'" font-weight="900" text-anchor="middle">
      <text x="62" y="52" font-size="30" fill="#60a5fa" transform="rotate(-8 62 52)">قرمز</text>
      <text x="140" y="60" font-size="26" fill="#fde047" transform="rotate(6 140 60)">سبز</text>
      <text x="100" y="100" font-size="30" fill="#4ade80">آبی</text>
    </g>

    <!-- حرف گمشده -->
    <g v-else-if="game === 'missing-letter'" font-weight="900" text-anchor="middle" font-size="28">
      <g v-for="(c, i) in ['ک', '?', 'ا', 'ب']" :key="i">
        <!-- راست‌به‌چپ: حرف اول سمت راست -->
        <rect
          :x="145 - i * 41"
          y="38"
          width="34"
          height="44"
          rx="8"
          :fill="c === '?' ? '#fde047' : '#fff'"
          :opacity="c === '?' ? 1 : 0.92"
          :transform="c === '?' ? `rotate(-8 ${162 - i * 41} 60)` : ''"
        />
        <text :x="162 - i * 41" y="70" :fill="c === '?' ? '#7c2d12' : '#3730a3'">{{ c === '?' ? '؟' : c }}</text>
      </g>
    </g>

    <!-- محاسبات ذهنی: زنجیرهٔ عملیات -->
    <g v-else-if="game === 'chain-calc'" font-weight="900" text-anchor="middle" font-size="18">
      <path d="M40 60 H160" stroke="#fff" stroke-width="4" stroke-dasharray="6 6" opacity=".7" />
      <g v-for="(t, i) in ['۳', '+۵', '×۲', '۱۶']" :key="i">
        <circle :cx="168 - i * 45" cy="60" r="20" :fill="i === 3 ? '#fde047' : '#fff'" />
        <text :x="168 - i * 45" y="67" :fill="i === 3 ? '#9a3412' : '#b91c1c'">{{ t }}</text>
      </g>
    </g>

    <!-- محاسبات سریع: صاعقه -->
    <g v-else-if="game === 'quick-math'">
      <path d="M118 8 L78 66 H102 L86 112 L132 46 H106 Z" fill="#fff" stroke="#9a3412" stroke-width="3" stroke-linejoin="round" />
      <text x="44" y="56" font-size="22" font-weight="900" fill="#7c2d12" text-anchor="middle">۷×۸</text>
      <text x="160" y="96" font-size="22" font-weight="900" fill="#7c2d12" text-anchor="middle">۵۶</text>
    </g>

    <!-- حافظه ترتیبی: چهار دکمهٔ رنگی -->
    <g v-else-if="game === 'sequence-memory'">
      <rect x="58" y="14" width="40" height="40" rx="10" fill="#f87171" />
      <rect x="102" y="14" width="40" height="40" rx="10" fill="#fde047" stroke="#fff" stroke-width="4" />
      <rect x="58" y="58" width="40" height="40" rx="10" fill="#4ade80" />
      <rect x="102" y="58" width="40" height="40" rx="10" fill="#60a5fa" />
      <circle cx="122" cy="34" r="22" fill="#fff" opacity=".35" />
      <text x="160" y="110" font-size="14" font-weight="900" fill="#fff" opacity=".8">۱ ۲ ۳ …</text>
    </g>

    <!-- دسته‌بندی سریع: سه جعبه -->
    <g v-else-if="game === 'quick-category'" text-anchor="middle" font-size="26">
      <g v-for="(e, i) in ['🦁', '🍎', '🏙️']" :key="i">
        <rect :x="20 + i * 58" y="46" width="48" height="50" rx="8" fill="#fff" opacity=".9" />
        <rect :x="16 + i * 58" y="40" width="56" height="12" rx="4" fill="#fde047" />
        <text :x="44 + i * 58" y="82">{{ e }}</text>
      </g>
    </g>

    <!-- متضاد/مترادف -->
    <g v-else-if="game === 'synonym-antonym'" font-weight="900" text-anchor="middle" font-size="20">
      <rect x="14" y="30" width="72" height="40" rx="20" fill="#fff" />
      <text x="50" y="57" fill="#be123c">گرم</text>
      <rect x="114" y="50" width="72" height="40" rx="20" fill="#fff" />
      <text x="150" y="77" fill="#5b21b6">سرد</text>
      <path
        d="M90 60 H110 M96 53 L89 60 L96 67 M104 53 L111 60 L104 67"
        stroke="#fde047"
        stroke-width="5"
        stroke-linecap="round"
        stroke-linejoin="round"
        fill="none"
      />
    </g>

    <!-- ضرب‌المثل: طومار -->
    <g v-else-if="game === 'proverb'">
      <rect x="40" y="20" width="120" height="80" rx="6" fill="#fef3c7" />
      <rect x="32" y="14" width="136" height="12" rx="6" fill="#d97706" />
      <rect x="32" y="94" width="136" height="12" rx="6" fill="#d97706" />
      <path d="M144 44 H56 M144 58 H80 M144 72 H104" stroke="#92400e" stroke-width="5" stroke-linecap="round" />
      <rect x="56" y="64" width="42" height="16" rx="5" fill="none" stroke="#dc2626" stroke-width="3" stroke-dasharray="4 3" />
    </g>

    <!-- کلمهٔ مزاحم -->
    <g v-else-if="game === 'odd-one-out'">
      <circle cx="40" cy="60" r="16" fill="#fff" />
      <circle cx="80" cy="60" r="16" fill="#fff" />
      <path d="M120 42 L138 76 H102 Z" fill="#fde047" stroke="#fff" stroke-width="3" />
      <circle cx="160" cy="60" r="16" fill="#fff" />
      <circle cx="120" cy="62" r="30" fill="none" stroke="#fde047" stroke-width="3" stroke-dasharray="5 5" />
    </g>

    <!-- حافظهٔ عددی معکوس -->
    <g v-else-if="game === 'reverse-memory'" font-weight="900" font-size="28" text-anchor="middle">
      <text x="100" y="52" fill="#fff">۱ ۲ ۳ ۴</text>
      <text x="100" y="100" fill="#fde047">۴ ۳ ۲ ۱</text>
      <path d="M172 40 q16 22 0 44 m0 0 l-9 -3 m9 3 l1 -9" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" />
    </g>

    <!-- کلمه‌روز: جدول رنگی -->
    <g v-else-if="game === 'word-of-day'">
      <g
        v-for="(row, r) in [
          ['b', 'y', 'b', 'g', 'b'],
          ['g', 'b', 'y', 'g', 'y'],
          ['g', 'g', 'g', 'g', 'g']
        ]"
        :key="r"
      >
        <rect
          v-for="(c, i) in row"
          :key="i"
          :x="42 + i * 24"
          :y="16 + r * 32"
          width="21"
          height="28"
          rx="4"
          :fill="c === 'g' ? '#4ade80' : c === 'y' ? '#facc15' : '#94a3b8'"
          stroke="#fff"
          stroke-width="1.5"
        />
      </g>
    </g>

    <!-- اسم‌فامیل: برگهٔ جدول و مداد -->
    <g v-else-if="game === 'esm-famil'">
      <rect x="30" y="16" width="120" height="90" rx="6" fill="#fff" transform="rotate(-4 90 60)" />
      <g transform="rotate(-4 90 60)" stroke="#fb923c" stroke-width="2">
        <path d="M30 40 H150 M30 62 H150 M30 84 H150 M70 16 V106 M110 16 V106" />
      </g>
      <g transform="rotate(-4 90 60)" font-size="12" font-weight="800" fill="#9f1239" text-anchor="middle">
        <text x="130" y="33">اسم</text>
        <text x="90" y="33">فامیل</text>
        <text x="50" y="33">شهر</text>
        <text x="130" y="56">دانیال</text>
        <text x="50" y="56">دماوند</text>
      </g>
      <g transform="rotate(35 160 70)">
        <rect x="150" y="30" width="14" height="70" rx="2" fill="#facc15" />
        <path d="M150 100 L157 116 L164 100 Z" fill="#fde68a" />
        <rect x="150" y="26" width="14" height="8" fill="#f472b6" />
      </g>
    </g>

    <!-- مشاعره: کتاب باز و گل -->
    <g v-else-if="game === 'mosha-ere'">
      <path d="M100 34 C80 24 50 24 30 30 V98 C50 92 80 92 100 100 Z" fill="#fff7ed" />
      <path d="M100 34 C120 24 150 24 170 30 V98 C150 92 120 92 100 100 Z" fill="#fff" />
      <path
        d="M44 48 q22 -6 44 0 M44 62 q22 -6 44 0 M112 48 q22 -6 44 0 M112 62 q22 -6 44 0"
        stroke="#9f1239"
        stroke-width="3"
        fill="none"
        stroke-linecap="round"
      />
      <circle cx="160" cy="88" r="11" fill="#e11d48" />
      <circle cx="160" cy="88" r="5" fill="#9f1239" />
      <path d="M160 99 V114" stroke="#16a34a" stroke-width="3" />
    </g>

    <!-- چیستان -->
    <g v-else-if="game === 'riddle'">
      <circle cx="100" cy="62" r="40" fill="#facc15" opacity=".18" />
      <text x="100" y="92" font-size="84" font-weight="900" fill="#fde047" text-anchor="middle">؟</text>
      <g fill="#fff">
        <path d="M40 30 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3 Z" />
        <path d="M160 80 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2 Z" />
        <circle cx="150" cy="28" r="3" />
        <circle cx="52" cy="92" r="2.5" />
      </g>
    </g>

    <!-- دوز (نه‌تایی) -->
    <g v-else-if="game === 'morris'">
      <g fill="none" stroke="#fde68a" stroke-width="3">
        <rect x="55" y="10" width="90" height="100" />
        <rect x="72" y="28" width="56" height="64" />
        <rect x="88" y="46" width="24" height="28" />
        <path d="M100 10 V46 M100 74 V110 M55 60 H88 M112 60 H145" />
      </g>
      <circle cx="55" cy="10" r="8" fill="#fff" />
      <circle cx="100" cy="10" r="8" fill="#fff" />
      <circle cx="145" cy="10" r="8" fill="#fff" />
      <circle cx="72" cy="92" r="8" fill="#1c1917" stroke="#fde68a" stroke-width="2" />
      <circle cx="128" cy="60" r="8" fill="#1c1917" stroke="#fde68a" stroke-width="2" />
    </g>

    <!-- معمای شطرنج: صفحه و اسب -->
    <g v-else-if="game === 'chess-puzzle'">
      <g v-for="i in 16" :key="i">
        <rect
          :x="36 + ((i - 1) % 4) * 32"
          :y="-4 + Math.floor((i - 1) / 4) * 32"
          width="32"
          height="32"
          :fill="(((i - 1) % 4) + Math.floor((i - 1) / 4)) % 2 === 0 ? '#e2e8f0' : '#64748b'"
          opacity=".55"
        />
      </g>
      <text x="100" y="98" font-size="80" text-anchor="middle" fill="#fff" stroke="#0f172a" stroke-width="2">♞</text>
      <text x="164" y="40" font-size="20" font-weight="900" fill="#fde047">+</text>
    </g>

    <!-- بازار: سایبان و سکه -->
    <g v-else-if="game === 'bazaar'">
      <rect x="40" y="46" width="120" height="62" fill="#fff7ed" />
      <g v-for="i in 6" :key="i">
        <path :d="`M${40 + (i - 1) * 20} 28 h20 v18 a10 10 0 0 1 -20 0 Z`" :fill="i % 2 ? '#dc2626' : '#fff'" />
      </g>
      <rect x="62" y="70" width="34" height="38" fill="#c2410c" />
      <circle cx="132" cy="84" r="13" fill="#facc15" stroke="#a16207" stroke-width="3" />
      <text x="132" y="90" font-size="14" font-weight="900" text-anchor="middle" fill="#a16207">ت</text>
      <circle cx="150" cy="100" r="9" fill="#facc15" stroke="#a16207" stroke-width="2" />
    </g>

    <!-- تقویم ذهنی -->
    <g v-else-if="game === 'mental-calendar'" text-anchor="middle">
      <rect x="56" y="18" width="88" height="90" rx="10" fill="#fff" />
      <rect x="56" y="18" width="88" height="26" rx="10" fill="#e11d48" />
      <rect x="56" y="34" width="88" height="10" fill="#e11d48" />
      <circle cx="78" cy="18" r="4" fill="#334155" />
      <circle cx="122" cy="18" r="4" fill="#334155" />
      <text x="100" y="38" font-size="13" font-weight="800" fill="#fff">فروردین</text>
      <text x="100" y="88" font-size="40" font-weight="900" fill="#155e75">۱</text>
      <text x="100" y="103" font-size="10" fill="#64748b">جمعه</text>
    </g>

    <!-- نقشهٔ ایران: نقشهٔ تاشده و سنجاق -->
    <g v-else-if="game === 'iran-map'">
      <path d="M30 26 L75 16 L125 26 L170 16 V94 L125 104 L75 94 L30 104 Z" fill="#ecfdf5" />
      <path d="M75 16 V94 M125 26 V104" stroke="#a7f3d0" stroke-width="2" />
      <path d="M48 46 q20 -16 40 -4 t36 4 q18 -10 30 8 q-6 22 -26 30 q-24 8 -44 -2 q-26 -6 -36 -36 Z" fill="#34d399" opacity=".7" />
      <path
        d="M104 30 c-12 0 -20 9 -20 19 c0 14 20 33 20 33 s20 -19 20 -33 c0 -10 -8 -19 -20 -19 Z"
        fill="#e11d48"
        stroke="#fff"
        stroke-width="3"
      />
      <circle cx="104" cy="49" r="7" fill="#fff" />
    </g>

    <!-- کاشی‌کاری: ستارهٔ هشت‌پر -->
    <g v-else-if="game === 'tile-memory'">
      <g v-for="(t, i) in TILES" :key="i" :transform="`translate(${t.x} ${t.y})`">
        <rect x="-16" y="-16" width="32" height="32" :fill="t.c" />
        <rect x="-16" y="-16" width="32" height="32" :fill="t.c" transform="rotate(45)" />
        <circle r="8" fill="#0c4a6e" />
      </g>
    </g>

    <!-- زنجیرهٔ کلمات: حلقه‌ها -->
    <g v-else-if="game === 'word-chain'" font-weight="900" text-anchor="middle" font-size="16">
      <g v-for="(w, i) in ['سیب', 'بادام', 'موز']" :key="i">
        <rect :x="132 - i * 60" :y="i % 2 ? 56 : 38" width="54" height="30" rx="15" fill="none" stroke="#fff" stroke-width="5" />
        <text :x="159 - i * 60" :y="(i % 2 ? 56 : 38) + 21" fill="#fff">{{ w }}</text>
      </g>
      <circle cx="129" cy="62" r="5" fill="#fde047" />
      <circle cx="69" cy="62" r="5" fill="#fde047" />
    </g>

    <!-- رمزشکن: قفل -->
    <g v-else-if="game === 'code-breaker'">
      <path d="M78 54 V40 a22 22 0 0 1 44 0 V54" fill="none" stroke="#e5e7eb" stroke-width="9" />
      <rect x="62" y="52" width="76" height="58" rx="10" fill="#f59e0b" />
      <g font-weight="900" font-size="16" text-anchor="middle">
        <rect v-for="i in 3" :key="i" :x="66 + (i - 1) * 24" y="70" width="20" height="26" rx="4" fill="#1f2937" />
        <text x="76" y="89" fill="#4ade80">۷</text>
        <text x="100" y="89" fill="#facc15">۲</text>
        <text x="124" y="89" fill="#fff">؟</text>
      </g>
    </g>
  </svg>
</template>

<style scoped>
.art {
  display: block;
  width: 100%;
  height: 100%;
  font-family: 'Vazirmatn', system-ui, sans-serif;
}
</style>
