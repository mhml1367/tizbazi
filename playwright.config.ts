import { defineConfig } from '@playwright/test'

const PORT = Number(process.env.E2E_PORT ?? 3100)

// از مرورگر Edge/Chrome نصب‌شدهٔ سیستم استفاده می‌شود (بدون دانلود مرورگر)؛ با E2E_CHANNEL=chrome قابل تغییر است
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 120_000,
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: `http://localhost:${PORT}`,
    channel: process.env.E2E_CHANNEL ?? 'msedge',
    locale: 'fa-IR',
    timezoneId: 'Asia/Tehran',
    trace: 'retain-on-failure'
  },
  webServer: {
    command: `node node_modules/nuxt/bin/nuxt.mjs dev --port ${PORT}`,
    url: `http://localhost:${PORT}/api/auth/me`,
    reuseExistingServer: true,
    timeout: 180_000
  }
})
