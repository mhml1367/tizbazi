import { z } from 'zod'

// پیام‌های پیش‌فرض اعتبارسنجی به فارسی
z.config(z.locales.fa())

// نام نمایشی: ۲ تا ۲۰ کاراکتر، فقط حروف (فارسی/لاتین)، عدد، فاصله، خط‌تیره و زیرخط
export const displayNameSchema = z
  .string()
  .trim()
  .min(2, 'نام نمایشی حداقل ۲ کاراکتر باشد')
  .max(20, 'نام نمایشی حداکثر ۲۰ کاراکتر باشد')
  // نیم‌فاصله (U+200C) برای نام‌هایی مثل «علی‌رضا» مجاز است
  .regex(/^[\p{L}\p{N}‌ _-]+$/u, 'نام نمایشی نباید کاراکتر خاص داشته باشد')

const fingerprint = z.string().min(8).max(2000)

export const guestLoginSchema = z.object({ displayName: displayNameSchema, fingerprint })

export const registerSchema = z.object({
  displayName: displayNameSchema,
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('ایمیل معتبر نیست')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  password: z.string().min(6, 'رمز عبور حداقل ۶ کاراکتر باشد').max(100),
  fingerprint
})

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(100)
})

export const GAME_IDS = [
  'stroop',
  'missing-letter',
  'chain-calc',
  'quick-math',
  'sequence-memory',
  'quick-category',
  'synonym-antonym',
  'proverb',
  'odd-one-out',
  'reverse-memory'
] as const
export type GameId = (typeof GAME_IDS)[number]

export const scoreSchema = z.object({
  gameId: z.enum(GAME_IDS),
  rawScore: z.number().int().min(0).max(100000),
  accuracy: z.number().min(0).max(100),
  duration: z
    .number()
    .int()
    .min(0)
    .max(1000 * 60 * 30),
  difficulty: z.number().int().min(1).max(3),
  // سریع‌ترین پاسخ درست (برای نشان «سرعت‌سنج»)
  fastestCorrectMs: z.number().int().min(0).max(60000).optional()
})
