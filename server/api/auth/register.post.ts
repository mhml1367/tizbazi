import { randomUUID } from 'node:crypto'
import { registerSchema } from '#shared/validation'

// ثبت‌نام؛ اگر همین دستگاه قبلاً به‌صورت مهمان بازی کرده، همان کاربر ارتقا می‌یابد
// و تمام امتیازها و پیشرفتش حفظ می‌شود
export default defineEventHandler(async (event) => {
  const p = registerSchema.safeParse(await readBody(event))
  if (!p.success) throw createError({ statusCode: 400, message: p.error.issues[0]!.message })
  const { displayName, email, password, fingerprint } = p.data

  if (email && (await prisma.user.findUnique({ where: { email } }))) {
    throw createError({ statusCode: 409, message: 'این ایمیل قبلاً ثبت شده است' })
  }
  const passwordHash = await hashPassword(password)
  const fp = normalizeFingerprint(fingerprint)
  const guest = await prisma.user.findUnique({ where: { fingerprint: fp } })

  const user =
    guest && !guest.isRegistered
      ? await prisma.user.update({
          where: { id: guest.id },
          data: { displayName, email: email ?? null, passwordHash, isRegistered: true }
        })
      : await prisma.user.create({
          data: {
            displayName,
            email: email ?? null,
            passwordHash,
            isRegistered: true,
            // اثرانگشت یکتاست؛ برای دستگاهی که قبلاً حساب ثبت‌شده دارد مقدار تازه می‌سازیم
            fingerprint: guest ? normalizeFingerprint(fp + randomUUID()) : fp
          }
        })

  await issueSession(event, user.id)
  return { user: publicUser(user) }
})
