// سرویس‌ورکر تیزبازی: فایل‌های ثابت کش می‌شوند، صفحه‌ها «اول شبکه» و در قطعی صفحهٔ آفلاین.
// API هرگز کش نمی‌شود (امتیاز و ورود باید همیشه از سرور بیایند).
const VERSION = 'v2'
const STATIC = `tiz-static-${VERSION}`
const OFFLINE = '/offline.html'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC)
      .then((c) => c.addAll([OFFLINE, '/favicon.svg', '/icons/icon-192.png']))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('tiz-static-') && k !== STATIC).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return

  // فایل‌های هش‌دار ساخت و آیکون‌ها: اول کش
  if (url.pathname.startsWith('/_nuxt/') || url.pathname.startsWith('/icons/') || url.pathname.startsWith('/fonts/')) {
    event.respondWith(
      caches.open(STATIC).then(async (cache) => {
        const hit = await cache.match(req)
        if (hit) return hit
        const res = await fetch(req)
        if (res.ok) cache.put(req, res.clone())
        return res
      })
    )
    return
  }

  // صفحه‌ها: اول شبکه؛ بدون اینترنت صفحهٔ آفلاین
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.match(OFFLINE)))
  }
})
