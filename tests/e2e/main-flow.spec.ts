import { expect, test, type Page } from '@playwright/test'

// جریان اصلی: ورود مهمان ← بازی ← ذخیرهٔ امتیاز ← دیدن در لیدربورد (+ داشبورد)
const faDigits = (s: string) => s.replace(/[۰-۹]/g, (c) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c)))

/** عبارت روی صفحه («۸ × ۷ = ؟») را حل می‌کند و گزینهٔ درست را می‌زند */
async function answerQuickMath(page: Page) {
  const expr = (await page.locator('.expr').innerText()).replace('= ؟', '')
  const js = faDigits(expr).replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-')
  const answer = String(Function(`return (${js})`)())
  await page.locator('.opt', { hasText: new RegExp(`^\\s*${answer.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]!)}\\s*$`) }).click()
}

test('ورود مهمان، بازی، ذخیرهٔ امتیاز و لیدربورد', async ({ page }) => {
  const name = `ای‌تو‌ای ${Date.now().toString().slice(-6)}`

  // ورود مهمان (صفحهٔ بازی کاربر ناشناس را به ورود می‌فرستد)
  await page.goto('/games/quick-math')
  await expect(page).toHaveURL(/\/login\?next=/)
  await page.getByRole('textbox').fill(name)
  await page.getByRole('button', { name: 'ادامه' }).click()
  await expect(page).toHaveURL(/\/games\/quick-math$/)
  await expect(page.getByText(name)).toBeVisible()

  // بازی (آسان) با پاسخ‌های درست
  await page.getByRole('button', { name: 'شروع بازی' }).click()
  await expect(page.locator('.expr')).toBeVisible({ timeout: 10_000 })
  for (let i = 0; i < 20; i++) {
    await answerQuickMath(page)
    if (
      !(await page
        .locator('.expr')
        .isVisible()
        .catch(() => false))
    )
      break
  }

  // نتیجه و ذخیرهٔ خودکار
  await expect(page.getByText('امتیاز ذخیره شد')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText(/دقت: ۱۰۰٪/)).toBeVisible()

  // لیدربورد (امروز، همین بازی)
  await page.getByRole('link', { name: 'لیدربورد' }).click()
  await page.getByRole('tab', { name: 'امروز' }).click()
  await page.getByRole('tab', { name: 'محاسبات سریع' }).click()
  const row = page.locator('tr', { hasText: name })
  await expect(row).toBeVisible()
  await expect(row).toContainText('(شما)')

  // داشبورد: سطح، streak و نشان «اولین قدم»
  await page.getByRole('link', { name: 'داشبورد' }).click()
  await expect(page.getByText('روز پیاپی')).toBeVisible()
  await expect(page.locator('.ach:not(.locked)', { hasText: 'اولین قدم' })).toBeVisible()
})

/** ورود مهمان و صبر تا پایان ورود (پس از ورود به صفحهٔ اصلی می‌رود و نام در سربرگ دیده می‌شود) */
async function loginGuest(page: Page, prefix: string) {
  const name = `${prefix} ${Date.now().toString().slice(-6)}`
  await page.goto('/login')
  await page.getByRole('textbox').fill(name)
  await page.getByRole('button', { name: 'ادامه' }).click()
  await expect(page).not.toHaveURL(/\/login/)
  await expect(page.getByText(name)).toBeVisible()
  return name
}

test('بازی تصادفی: شروع جلسهٔ ترکیبی با بازی متمایز', async ({ page }) => {
  await loginGuest(page, 'ترکیب')
  await page.getByRole('button', { name: /بازی تصادفی/ }).click()
  await expect(page).toHaveURL(/\/games\/[a-z-]+$/)
  const mix = await page.evaluate(() => JSON.parse(sessionStorage.getItem('tiz_mix') ?? 'null'))
  expect(mix.gameIds.length).toBeGreaterThanOrEqual(3)
  expect(new Set(mix.gameIds).size).toBe(mix.gameIds.length)
  expect(page.url()).toContain(`/games/${mix.gameIds[0]}`)
})

test('تم تیره با ماندگاری در localStorage', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /حالت (تیره|روشن)/ }).click()
  const t = await page.evaluate(() => localStorage.getItem('tiz_theme'))
  await page.reload()
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe(t)
})

test('کلمه‌روز: تایپ با صفحه‌کلید روی صفحه و علامت‌گذاری حدس', async ({ page }) => {
  await loginGuest(page, 'کلمه')
  await page.goto('/games/word-of-day')
  await page.getByRole('tab', { name: 'تمرین' }).click()
  for (const ch of 'باران') await page.locator('.kbd .key', { hasText: new RegExp(`^${ch}$`) }).click()
  await page.getByRole('button', { name: 'ثبت' }).click()
  const first = page.locator('.grid .row').first().locator('.cell')
  await expect(first).toHaveCount(5)
  for (let i = 0; i < 5; i++) await expect(first.nth(i)).toHaveClass(/\b(g|y|b)\b/)
})
