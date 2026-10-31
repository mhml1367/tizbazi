// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'
import prettier from 'eslint-config-prettier'

export default withNuxt(prettier, {
  ignores: ['server/generated/**', 'prisma/migrations/**', 'playwright-report/**', 'test-results/**'],
  rules: {
    // نام فایل‌های صفحه‌ها مثل index.vue، login.vue و … تک‌کلمه‌ای است
    'vue/multi-word-component-names': 'off',
    // جلوگیری از XSS: هرگز HTML خام در قالب‌ها رندر نشود
    'vue/no-v-html': 'error',
    '@typescript-eslint/no-explicit-any': 'off'
  }
})
