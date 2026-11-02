import { guestLoginSchema, loginSchema } from '#shared/validation'

// ورود: ایمیل + رمز (حساب ثبت‌شده) یا نام نمایشی + اثرانگشت (مهمان)
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (body?.email) {
    const p = loginSchema.safeParse(body)
    if (!p.success) throw createError({ statusCode: 400, message: p.error.issues[0]!.message })
    const user = await prisma.user.findUnique({ where: { email: p.data.email } })
    // پیام یکسان برای ایمیل یا رمز اشتباه
    if (!user?.passwordHash || !(await verifyPassword(p.data.password, user.passwordHash))) {
      throw createError({ statusCode: 401, message: 'ایمیل یا رمز عبور اشتباه است' })
    }
    await issueSession(event, user.id)
    return { user: publicUser(user) }
  }

  const p = guestLoginSchema.safeParse(body)
  if (!p.success) throw createError({ statusCode: 400, message: p.error.issues[0]!.message })
  const fp = normalizeFingerprint(p.data.fingerprint)

  const existing = await prisma.user.findUnique({ where: { fingerprint: fp } })
  // اثرانگشت به‌تنهایی اجازهٔ ورود به حساب ثبت‌شده نمی‌دهد
  if (existing?.isRegistered) {
    throw createError({ statusCode: 403, message: 'این دستگاه به یک حساب ثبت‌شده تعلق دارد؛ با ایمیل و رمز وارد شوید' })
  }
  const user = existing
    ? await prisma.user.update({ where: { id: existing.id }, data: { displayName: p.data.displayName } })
    : await prisma.user.create({ data: { displayName: p.data.displayName, fingerprint: fp } })
  await issueSession(event, user.id)
  return { user: publicUser(user) }
})
