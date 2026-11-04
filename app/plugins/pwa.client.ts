// ثبت سرویس‌ورکر (لازم برای نصب‌پذیری PWA و بستهٔ TWA)؛ فقط در ساخت نهایی
export default defineNuxtPlugin(() => {
  if (import.meta.dev || !('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
})
