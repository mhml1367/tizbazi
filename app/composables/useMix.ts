interface MixState {
  id: string
  gameIds: string[]
  /** اندیس بازی بعدی که باید انجام شود */
  index: number
  /** امتیاز کل پس از پایان ترکیب */
  total: number | null
}

const KEY = 'tiz_mix'

/** جلسهٔ ترکیبی: ۳ تا ۵ بازی پشت‌سرهم؛ پیشرفت در sessionStorage می‌ماند */
export function useMix() {
  const mix = useState<MixState | null>('mix', () => null)
  if (import.meta.client && mix.value === null) {
    try {
      const raw = sessionStorage.getItem(KEY)
      if (raw) mix.value = JSON.parse(raw)
    } catch {
      /* نادیده */
    }
  }
  const persist = () => {
    try {
      if (mix.value) sessionStorage.setItem(KEY, JSON.stringify(mix.value))
      else sessionStorage.removeItem(KEY)
    } catch {
      /* نادیده */
    }
  }

  const nextGame = computed(() => (mix.value && mix.value.index < mix.value.gameIds.length ? mix.value.gameIds[mix.value.index]! : null))

  async function start() {
    const r = await $fetch<{ id: string; gameIds: string[] }>('/api/games/mix', { method: 'POST' })
    mix.value = { id: r.id, gameIds: r.gameIds, index: 0, total: null }
    persist()
    await navigateTo(`/games/${r.gameIds[0]}`)
  }

  /** پس از ذخیرهٔ امتیاز یک بازی صدا زده می‌شود؛ فقط اگر همان بازیِ نوبت‌دار باشد جلو می‌رود */
  async function afterGame(gameId: string) {
    const m = mix.value
    if (!m || m.total !== null || m.gameIds[m.index] !== gameId) return
    const next: MixState = { ...m, index: m.index + 1 }
    if (next.index >= next.gameIds.length) {
      const r = await $fetch<{ totalScore: number }>('/api/games/mix/complete', { method: 'POST', body: { id: m.id } })
      next.total = r.totalScore
    }
    mix.value = next
    persist()
  }

  function clear() {
    mix.value = null
    persist()
  }

  return { mix, nextGame, start, afterGame, clear }
}
