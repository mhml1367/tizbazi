import { prisma } from './db'
import { tehranDayKey } from '#shared/gamification'

const DAY = 86_400_000
const dayNum = (key: string) => {
  const [y, m, d] = key.split('-').map(Number)
  return Math.floor(Date.UTC(y!, m! - 1, d!) / DAY)
}

/**
 * وضعیت streak با درنظرگرفتن فاصله: اگر آخرین بازی قبل از «دیروز» بوده، streak عملاً صفر است.
 * با persist=true مقدار صفر شده در دیتابیس هم ذخیره می‌شود.
 */
export async function currentStreak(userId: string, today: string, persist = false) {
  const row = await prisma.userStreak.findUnique({ where: { userId } })
  if (!row) return { current: 0, longest: 0, lastPlayDay: null as string | null, playedToday: false }
  const last = row.lastPlayDate ? tehranDayKey(row.lastPlayDate) : null
  const broken = last !== null && dayNum(today) - dayNum(last) > 1
  if (broken && persist && row.currentStreak !== 0) {
    await prisma.userStreak.update({ where: { userId }, data: { currentStreak: 0 } })
  }
  return { current: broken ? 0 : row.currentStreak, longest: row.longestStreak, lastPlayDay: last, playedToday: last === today }
}
