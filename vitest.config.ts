import { defineConfig } from 'vitest/config'

// تست‌های واحد (بدون سرور و دیتابیس)؛ تست‌های یکپارچگی با vitest.integration.config.ts اجرا می‌شوند
export default defineConfig({
  test: { include: ['tests/unit/**/*.test.ts'] }
})
