import { prisma } from './db'

// بانک‌های محتوا در حافظه کش می‌شوند؛ هر چند ثانیه فقط updatedAt بررسی می‌شود و اگر seed دوباره
// اجرا شده باشد داده تازه خوانده می‌شود (نیازی به راه‌اندازی دوبارهٔ سرور نیست)
const CHECK_MS = 10_000

interface Entry {
  data: unknown
  version: number
  checkedAt: number
}
const cache = new Map<string, Entry>()

/** داده‌ٔ یک نوع محتوا (ردیف با key = «all») */
export async function getContent<T>(kind: string): Promise<T> {
  const where = { kind_key: { kind, key: 'all' } }
  const hit = cache.get(kind)
  if (hit && Date.now() - hit.checkedAt < CHECK_MS) return hit.data as T

  if (hit) {
    const row = await prisma.contentItem.findUnique({ where, select: { updatedAt: true } })
    if (row && row.updatedAt.getTime() === hit.version) {
      hit.checkedAt = Date.now()
      return hit.data as T
    }
  }
  const row = await prisma.contentItem.findUnique({ where })
  if (!row) throw createError({ statusCode: 503, statusMessage: 'بانک داده خالی است؛ npm run seed را اجرا کنید' })
  cache.set(kind, { data: row.data, version: row.updatedAt.getTime(), checkedAt: Date.now() })
  return row.data as T
}

/**
 * ساختار مشتق از یک محتوا (مثل Set واژه‌نامه) که فقط وقتی محتوای پایه عوض شد دوباره ساخته می‌شود.
 * key جدا از kind است تا از یک محتوا چند ساختار مختلف ساخت.
 */
const derived = new Map<string, { source: unknown; value: unknown }>()
export async function getDerived<S, T>(kind: string, key: string, build: (data: S) => T | Promise<T>): Promise<T> {
  const data = await getContent<S>(kind)
  const hit = derived.get(key)
  if (hit && hit.source === data) return hit.value as T
  const value = await build(data)
  derived.set(key, { source: data, value })
  return value
}

/** واژه‌نامهٔ تأیید کلمه به‌صورت Set (برای جست‌وجوی سریع) */
export const getDictionary = () => getDerived<string[], Set<string>>('dictionary', 'dictionary-set', (d) => new Set(d))
