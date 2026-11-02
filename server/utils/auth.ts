import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { createHash } from 'node:crypto'
import type { H3Event } from 'h3'
import { prisma } from './db'

const COOKIE = 'tiz_token'
const MAX_AGE = 60 * 60 * 24 * 7 // ۷ روز

function secret() {
  const s = useRuntimeConfig().jwtSecret
  if (!s || s.length < 32) {
    throw createError({ statusCode: 500, message: 'JWT_SECRET تنظیم نشده یا کوتاه است' })
  }
  return new TextEncoder().encode(s)
}

export const hashPassword = (p: string) => bcrypt.hash(p, 12)
export const verifyPassword = (p: string, hash: string) => bcrypt.compare(p, hash)

/** اثرانگشت خام کلاینت را برای ذخیره، دوباره سمت سرور هش می‌کنیم */
export const normalizeFingerprint = (raw: string) => createHash('sha256').update(raw).digest('hex')

export async function issueSession(event: H3Event, userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret())
  setCookie(event, COOKIE, token, {
    httpOnly: true,
    // فقط روی HTTPS (مستقیم یا پشت پراکسی)؛ روی http مرورگر کوکی Secure را دور می‌اندازد
    secure: getRequestProtocol(event, { xForwardedProto: true }) === 'https',
    sameSite: 'strict',
    path: '/',
    maxAge: MAX_AGE
  })
}

export const clearAuthCookie = (event: H3Event) => deleteCookie(event, COOKIE, { path: '/' })

/** کاربر فعلی یا null (بدون پرتاب خطا) */
export async function getSessionUser(event: H3Event) {
  const token = getCookie(event, COOKIE)
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret())
    if (!payload.sub) return null
    return await prisma.user.findUnique({ where: { id: payload.sub } })
  } catch {
    return null
  }
}

export async function requireUser(event: H3Event) {
  const user = await getSessionUser(event)
  if (!user) throw createError({ statusCode: 401, message: 'ابتدا وارد شوید' })
  return user
}

export const publicUser = (u: { id: string; displayName: string; isRegistered: boolean; email: string | null }) => ({
  id: u.id,
  displayName: u.displayName,
  isRegistered: u.isRegistered,
  email: u.email
})
