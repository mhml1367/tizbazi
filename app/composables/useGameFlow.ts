import type { GameId } from '~~/shared/validation'

export interface ScorePayload {
  rawScore: number
  accuracy: number
  duration: number
  fastestCorrectMs?: number
}

/** بخش‌های مشترک همهٔ بازی‌ها: ورود، سختی (ذخیره در localStorage)، شمارش معکوس ۳-۲-۱ و ذخیرهٔ امتیاز */
export function useGameFlow(gameId: GameId) {
  const { user, refresh, loaded } = useAuth()
  const mixApi = useMix()
  const phase = ref<'idle' | 'countdown' | 'playing' | 'done'>('idle')
  const difficulty = ref<1 | 2 | 3>(1)
  const count = ref(3)
  const saveState = ref<'idle' | 'saving' | 'saved' | 'failed'>('idle')
  const reward = ref<any>(null)
  let cd: ReturnType<typeof setInterval> | undefined

  const key = `tiz_diff_${gameId}`

  onMounted(async () => {
    if (!loaded.value) await refresh()
    if (!user.value) return navigateTo(`/login?next=/games/${gameId}`)
    try {
      const d = Number(localStorage.getItem(key))
      if (d === 1 || d === 2 || d === 3) difficulty.value = d
    } catch {
      /* نادیده */
    }
  })
  onBeforeUnmount(() => clearInterval(cd))

  function setDifficulty(d: 1 | 2 | 3) {
    difficulty.value = d
    try {
      localStorage.setItem(key, String(d))
    } catch {
      /* نادیده */
    }
  }

  /** شمارش معکوس را اجرا می‌کند و سپس onGo را صدا می‌زند */
  function countdown(onGo: () => void) {
    saveState.value = 'idle'
    reward.value = null
    phase.value = 'countdown'
    count.value = 3
    clearInterval(cd)
    cd = setInterval(() => {
      if (--count.value <= 0) {
        clearInterval(cd)
        phase.value = 'playing'
        onGo()
      }
    }, 1000)
  }

  async function finish(p: ScorePayload) {
    if (phase.value === 'done') return
    phase.value = 'done'
    saveState.value = 'saving'
    try {
      reward.value = await $fetch('/api/scores', {
        method: 'POST',
        body: { gameId, difficulty: difficulty.value, ...p, duration: Math.min(p.duration, 30 * 60 * 1000) }
      })
      saveState.value = 'saved'
      await mixApi.afterGame(gameId)
    } catch {
      saveState.value = 'failed'
    }
  }

  return { user, phase, difficulty, count, saveState, reward, setDifficulty, countdown, finish }
}
