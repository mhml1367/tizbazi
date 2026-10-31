import { tehranDayKey } from '#shared/gamification'

// بررسی و به‌روزرسانی streak روزانه؛ اگر یک روز کامل بازی نشده باشد ریست می‌شود
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  return currentStreak(user.id, tehranDayKey(), true)
})
