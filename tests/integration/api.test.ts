import { beforeAll, describe, expect, it } from 'vitest'
import { randomUUID } from 'node:crypto'

// تست یکپارچگی APIهای احراز هویت، امتیاز، لیدربورد، گیمیفیکیشن و بازی ترکیبی روی سرور واقعی.
// کاربران آزمایشی با پیشوند «تست_» ساخته می‌شوند و در دیتابیس باقی می‌مانند.
// نام BASE_URL عمداً استفاده نشده: Vitest خودش آن را روی «/» تنظیم می‌کند
const BASE = process.env.TIZ_BASE_URL ?? 'http://localhost:3100'

/** یک «مرورگر» ساده با cookie jar */
class Client {
  cookie = ''
  async call(method: string, path: string, body?: unknown) {
    const res = await fetch(BASE + path, {
      method,
      headers: { 'content-type': 'application/json', ...(this.cookie ? { cookie: this.cookie } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body)
    })
    const set = res.headers.get('set-cookie')
    if (set) this.cookie = set.split(';')[0]!
    const text = await res.text()
    let json: any = null
    try {
      json = JSON.parse(text)
    } catch {
      /* بدنهٔ غیر JSON */
    }
    return { status: res.status, json, setCookie: set }
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const suffix = () => randomUUID().replace(/\D/g, '').slice(0, 6)
const fp = () => `integration-test|${randomUUID()}|fa|Asia/Tehran`
const score = (gameId = 'quick-math', rawScore = 50) => ({ gameId, rawScore, accuracy: 80, duration: 20000, difficulty: 1 })

let up = false
beforeAll(async () => {
  try {
    up = (await fetch(BASE + '/api/auth/me')).ok
  } catch {
    up = false
  }
  if (!up) console.warn(`سرور روی ${BASE} در دسترس نیست؛ تست‌های یکپارچگی رد می‌شوند`)
})
const itLive = (name: string, fn: () => Promise<void>) =>
  it(name, async (ctx) => {
    if (!up) return ctx.skip()
    await fn()
  })

describe('احراز هویت', () => {
  itLive('ورود مهمان: کوکی HttpOnly/SameSite=Strict و me', async () => {
    const c = new Client()
    const r = await c.call('POST', '/api/auth/login', { displayName: `تست ${suffix()}`, fingerprint: fp() })
    expect(r.status).toBe(200)
    expect(r.json.user.isRegistered).toBe(false)
    expect(r.setCookie).toMatch(/HttpOnly/i)
    expect(r.setCookie).toMatch(/SameSite=Strict/i)
    const me = await c.call('GET', '/api/auth/me')
    expect(me.json.user.id).toBe(r.json.user.id)
  })

  itLive('نام نمایشی نامعتبر رد می‌شود (فارسی)', async () => {
    const c = new Client()
    for (const displayName of ['a', 'x'.repeat(21), '<script>']) {
      const r = await c.call('POST', '/api/auth/login', { displayName, fingerprint: fp() })
      expect(r.status).toBe(400)
      expect(r.json.statusMessage).toMatch(/[؀-ۿ]/)
    }
  })

  itLive('ثبت‌نام مهمان را ارتقا می‌دهد و امتیازها حفظ می‌شود؛ اثرانگشت به‌تنهایی کافی نیست', async () => {
    const c = new Client()
    const fingerprint = fp()
    const name = `تست ${suffix()}`
    const guest = (await c.call('POST', '/api/auth/login', { displayName: name, fingerprint })).json.user
    expect((await c.call('POST', '/api/scores', score())).status).toBe(200)

    const email = `t${suffix()}@example.com`
    const reg = await c.call('POST', '/api/auth/register', { displayName: name, email, password: 'secret12', fingerprint })
    expect(reg.status).toBe(200)
    expect(reg.json.user.id).toBe(guest.id) // همان کاربر ارتقا یافته
    expect(reg.json.user.isRegistered).toBe(true)
    expect((await c.call('GET', '/api/scores/me')).json.scores).toHaveLength(1)

    // ایمیل تکراری
    expect(
      (await new Client().call('POST', '/api/auth/register', { displayName: 'دیگری', email, password: 'secret12', fingerprint: fp() }))
        .status
    ).toBe(409)
    // رمز اشتباه و درست
    const other = new Client()
    expect((await other.call('POST', '/api/auth/login', { email, password: 'wrong-pass' })).status).toBe(401)
    expect((await other.call('POST', '/api/auth/login', { email, password: 'secret12' })).status).toBe(200)
    // ورود مهمان روی دستگاهِ حساب ثبت‌شده ممنوع است
    expect((await new Client().call('POST', '/api/auth/login', { displayName: name, fingerprint })).status).toBe(403)
    // خروج
    await other.call('POST', '/api/auth/logout')
    other.cookie = ''
    expect((await other.call('GET', '/api/auth/me')).json.user).toBeNull()
  })
})

describe('امتیاز', () => {
  itLive('نیازمند ورود، اعتبارسنجی ورودی و محدودیت نرخ ۱ در ۳ ثانیه', async () => {
    expect((await new Client().call('POST', '/api/scores', score())).status).toBe(401)

    const c = new Client()
    await c.call('POST', '/api/auth/login', { displayName: `تست ${suffix()}`, fingerprint: fp() })
    expect((await c.call('POST', '/api/scores', { ...score(), gameId: 'nope' })).status).toBe(400)
    expect((await c.call('POST', '/api/scores', { ...score(), rawScore: -1 })).status).toBe(400)
    expect((await c.call('POST', '/api/scores', { ...score(), rawScore: 10 ** 9 })).status).toBe(400)

    const first = await c.call('POST', '/api/scores', score('quick-math', 70))
    expect(first.status).toBe(200)
    expect(first.json.xpGained).toBeGreaterThanOrEqual(70) // امتیاز + پاداش streak روز اول
    expect(first.json.streak).toBe(1)
    expect(first.json.newAchievements.map((a: any) => a.id)).toContain('first-step')
    expect((await c.call('POST', '/api/scores', score())).status).toBe(429)

    const best = (await c.call('GET', '/api/scores/best')).json.best
    expect(best).toEqual([{ gameId: 'quick-math', best: 70, played: 1 }])
  })

  itLive(
    'رکورد شخصی: اولین بار prevBest=null، بعد فقط امتیاز بالاتر رکورد است',
    async () => {
      const c = new Client()
      await c.call('POST', '/api/auth/login', { displayName: `تست ${suffix()}`, fingerprint: fp() })
      const save = async (n: number) => {
        const r = await c.call('POST', '/api/scores', score('stroop', n))
        await new Promise((res) => setTimeout(res, 3100)) // محدودیت نرخ
        return r.json.record
      }
      expect(await save(10)).toEqual({ prevBest: null, isNew: false })
      expect(await save(8)).toEqual({ prevBest: 10, isNew: false })
      expect(await save(15)).toEqual({ prevBest: 10, isNew: true })
    },
    20_000
  )
})

describe('لیدربورد و گیمیفیکیشن', () => {
  itLive('کاربر در لیدربورد بازی/مجموع دیده می‌شود و پارامترهای نامعتبر رد می‌شوند', async () => {
    const c = new Client()
    const name = `تست ${suffix()}`
    const id = (await c.call('POST', '/api/auth/login', { displayName: name, fingerprint: fp() })).json.user.id
    await c.call('POST', '/api/scores', score('proverb', 123))

    for (const period of ['today', 'week', 'month', 'year', 'all']) {
      const r = await c.call('GET', `/api/leaderboard?gameId=proverb&period=${period}`)
      expect(r.status).toBe(200)
      const row = r.json.rows.find((x: any) => x.userId === id)
      expect(row?.score).toBe(123)
      expect(r.json.meId).toBe(id)
    }
    const all = await c.call('GET', '/api/leaderboard?gameId=all&period=today')
    expect(all.json.rows.find((x: any) => x.userId === id)?.uniqueGames).toBe(1)
    // رتبه‌ها نزولی‌اند
    const scores = all.json.rows.map((x: any) => x.score)
    expect(scores).toEqual([...scores].sort((a: number, b: number) => b - a))

    expect((await c.call('GET', '/api/leaderboard?gameId=zzz')).status).toBe(400)
    expect((await c.call('GET', '/api/leaderboard?period=decade')).status).toBe(400)
  })

  itLive('XP، streak، نشان‌ها و چالش روزانه', async () => {
    const anon = new Client()
    for (const p of ['xp', 'streak', 'achievements', 'daily']) expect((await anon.call('GET', `/api/gamification/${p}`)).status).toBe(401)

    const c = new Client()
    await c.call('POST', '/api/auth/login', { displayName: `تست ${suffix()}`, fingerprint: fp() })
    await c.call('POST', '/api/scores', score('stroop', 40))

    const xp = (await c.call('GET', '/api/gamification/xp')).json
    expect(xp.totalXp).toBeGreaterThanOrEqual(40)
    expect(xp.level).toBe(Math.floor(Math.sqrt(xp.totalXp / 100)) + 1)
    expect(xp.progress).toBeGreaterThanOrEqual(0)
    expect(xp.progress).toBeLessThan(1)

    expect((await c.call('GET', '/api/gamification/streak')).json).toMatchObject({ current: 1, playedToday: true })
    expect((await c.call('POST', '/api/gamification/streak/check')).json.current).toBe(1)

    const ach = (await c.call('GET', '/api/gamification/achievements')).json.achievements
    expect(ach).toHaveLength(8)
    expect(ach.find((a: any) => a.id === 'first-step').unlocked).toBe(true)

    const daily = (await c.call('GET', '/api/gamification/daily')).json
    expect(daily.games).toHaveLength(3)
    expect(new Set(daily.games.map((g: any) => g.gameId)).size).toBe(3)
  })
})

describe('بازی ترکیبی', () => {
  itLive('۳ تا ۵ بازی متمایز؛ امتیاز کل از امتیازهای ذخیره‌شده؛ دوبار تکمیل نمی‌شود', async () => {
    const c = new Client()
    await c.call('POST', '/api/auth/login', { displayName: `تست ${suffix()}`, fingerprint: fp() })
    const mix = (await c.call('POST', '/api/games/mix')).json
    expect(mix.gameIds.length).toBeGreaterThanOrEqual(3)
    expect(mix.gameIds.length).toBeLessThanOrEqual(5)
    expect(new Set(mix.gameIds).size).toBe(mix.gameIds.length)

    let expected = 0
    for (const [i, gameId] of (mix.gameIds as string[]).entries()) {
      const raw = 20 + i * 5
      expected += raw
      expect((await c.call('POST', '/api/scores', score(gameId, raw))).status).toBe(200)
      await sleep(3100)
    }
    const done = await c.call('POST', '/api/games/mix/complete', { id: mix.id })
    expect(done.json.totalScore).toBe(expected)
    expect((await c.call('POST', '/api/games/mix/complete', { id: mix.id })).json.already).toBe(true)
    expect((await c.call('POST', '/api/games/mix/complete', { id: 'nonexistent' })).status).toBe(404)

    const board = (await c.call('GET', '/api/leaderboard?gameId=mix&period=today')).json.rows
    expect(board.some((r: any) => r.score >= expected)).toBe(true)
    // کاربر دیگری نمی‌تواند جلسهٔ ما را تکمیل کند
    const other = new Client()
    await other.call('POST', '/api/auth/login', { displayName: `تست ${suffix()}`, fingerprint: fp() })
    expect((await other.call('POST', '/api/games/mix/complete', { id: mix.id })).status).toBe(404)
  })
})

describe('بازی‌های ایرانی (APIهای سرور)', () => {
  itLive('کلمه‌روز: جواب پنهان، اعتبارسنجی حدس، سقف ۶ حدس و ثبت امتیاز توسط سرور', async () => {
    const c = new Client()
    await c.call('POST', '/api/auth/login', { displayName: `تست ${suffix()}`, fingerprint: fp() })
    const p = (await c.call('GET', '/api/games/word-of-day?mode=practice&fresh=1')).json
    expect(p.answer).toBeNull()
    expect(p.rows).toHaveLength(0)

    expect((await c.call('POST', '/api/games/word-of-day/guess', { mode: 'practice', guess: 'سیب' })).status).toBe(400)
    expect((await c.call('POST', '/api/games/word-of-day/guess', { mode: 'practice', guess: 'ززززز' })).status).toBe(422)

    let last: any
    for (const g of ['ستاره', 'آسمان', 'پرنده', 'کبوتر', 'گیلاس', 'بادام']) {
      last = (await c.call('POST', '/api/games/word-of-day/guess', { mode: 'practice', guess: g })).json
      if (last.finished) break
    }
    expect(last.finished).toBe(true)
    expect(typeof last.answer).toBe('string') // جواب فقط پس از پایان
    expect(last.reward).not.toBeNull()
    // معمای تمام‌شده حدس بیشتری نمی‌پذیرد
    expect((await c.call('POST', '/api/games/word-of-day/guess', { mode: 'practice', guess: 'باران' })).status).toBe(409)
    // روزانه برای همه یکسان است: دو کاربر، یک جواب (پس از پایان مقایسه نمی‌کنیم؛ فقط وجود وضعیت)
    expect((await c.call('GET', '/api/games/word-of-day?mode=daily')).json.mode).toBe('daily')
  })

  itLive('اسم‌فامیل: تأیید با بانک، کلمهٔ واقعی با امتیاز کمتر، حرف اشتباه صفر', async () => {
    const c = new Client()
    await c.call('POST', '/api/auth/login', { displayName: `تست ${suffix()}`, fingerprint: fp() })
    const r = (
      await c.call('POST', '/api/games/esm-famil/check', { letter: 'س', answers: { animal: 'سگ', name: 'سنگ', city: 'مشهد', food: '' } })
    ).json
    const by = Object.fromEntries(r.results.map((x: any) => [x.category, x]))
    expect(by.animal).toMatchObject({ status: 'verified', points: 10 })
    expect(by.name).toMatchObject({ status: 'word', points: 3 })
    expect(by.city).toMatchObject({ status: 'wrong-letter', points: 0 })
    expect(by.food.status).toBe('empty')
    expect(r.total).toBe(13)
    expect((await c.call('POST', '/api/games/esm-famil/check', { letter: 'ژ', answers: {} })).status).toBe(400) // حرف خارج از فهرست
  })

  itLive('زنجیرهٔ کلمات: کلمهٔ شروع، رد حرف اشتباه/تکراری، پاسخ رایانه با حرف درست', async () => {
    const c = new Client()
    await c.call('POST', '/api/auth/login', { displayName: `تست ${suffix()}`, fingerprint: fp() })
    const start = (await c.call('POST', '/api/games/word-chain', { difficulty: 1, history: [] })).json.reply as string
    expect(start.length).toBeGreaterThanOrEqual(3)
    const history = ['کتاب']
    expect((await c.call('POST', '/api/games/word-chain', { difficulty: 1, history, word: 'دریا' })).json.error).toBe('letter')
    expect((await c.call('POST', '/api/games/word-chain', { difficulty: 1, history: ['کتاب', 'باران'], word: 'کتاب' })).json.error).toBe(
      'letter'
    )
    const ok = (await c.call('POST', '/api/games/word-chain', { difficulty: 1, history, word: 'باران' })).json
    expect(ok.ok).toBe(true)
    if (ok.reply) expect(['ن']).toContain(Array.from(ok.reply as string)[0])
  })

  itLive('دورهای بازی‌های ایرانی و کنار گذاشتن کلمه‌روز و دوز از بازی تصادفی', async () => {
    const c = new Client()
    await c.call('POST', '/api/auth/login', { displayName: `تست ${suffix()}`, fingerprint: fp() })
    for (const [g, n] of [
      ['mosha-ere', 10],
      ['riddle', 10],
      ['iran-map', 12],
      ['chess-puzzle', 3]
    ] as const) {
      expect((await c.call('GET', `/api/games/rounds/${g}?difficulty=3`)).json.rounds).toHaveLength(n)
    }
    for (let i = 0; i < 5; i++) {
      const ids = (await c.call('POST', '/api/games/mix')).json.gameIds as string[]
      expect(ids).not.toContain('word-of-day')
      expect(ids).not.toContain('morris')
    }
  })
})
