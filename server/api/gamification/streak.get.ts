import { tehranDayKey } from '#shared/gamification'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  return currentStreak(user.id, tehranDayKey())
})
