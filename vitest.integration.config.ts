import { defineConfig } from 'vitest/config'

// نیازمند سرور در حال اجرا (npm run dev) و دیتابیس seed‌شده؛ آدرس را با TIZ_BASE_URL می‌توان عوض کرد
export default defineConfig({
  test: { include: ['tests/integration/**/*.test.ts'], testTimeout: 60_000, hookTimeout: 30_000, fileParallelism: false }
})
