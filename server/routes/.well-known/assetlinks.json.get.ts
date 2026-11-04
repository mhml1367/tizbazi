// تأیید دامنه برای TWA (Digital Asset Links): اپ اندروید با این فایل «تمام‌صفحه و بدون نوار آدرس» باز می‌شود.
// مقادیر از محیط خوانده می‌شوند (نه زمان build): TWA_PACKAGE (شناسهٔ اپ) و
// TWA_SHA256 (اثرانگشت کلید امضا؛ چند مقدار را با کاما جدا کنید)
export default defineEventHandler((event) => {
  const pkg = process.env.TWA_PACKAGE
  const fingerprints = (process.env.TWA_SHA256 ?? '')
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
  setHeader(event, 'content-type', 'application/json')
  setHeader(event, 'cache-control', 'public, max-age=300')
  if (!pkg || !fingerprints.length) return []
  return [
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: { namespace: 'android_app', package_name: pkg, sha256_cert_fingerprints: fingerprints }
    }
  ]
})
