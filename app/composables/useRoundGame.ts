import type { GameId } from '~~/shared/validation'

interface Options<R> {
  gameId: GameId
  /** مهلت هر دور (ثانیه) بر اساس سختی */
  seconds: (d: 1 | 2 | 3) => number
  /** آیا پاسخ کاربر برای این دور درست است؟ */
  judge: (round: R, choice: unknown) => boolean
  /** تغییر امتیاز: ok و ثانیه‌های باقی‌مانده */
  delta: (ok: boolean, secondsLeft: number) => number
  /** سقف زمان کل بازی (ثانیه)، اختیاری */
  totalSeconds?: number
}

/** بازی‌های «سؤال با تایمر و چند گزینه»: بارگذاری دورها از سرور، تایمر هر دور، امتیازدهی و ذخیره */
export function useRoundGame<R>(o: Options<R>) {
  const flow = useGameFlow(o.gameId)
  const { phase, difficulty, countdown, finish } = flow

  const rounds = ref<R[]>([]) as Ref<R[]>
  const idx = ref(0)
  const score = ref(0)
  const correct = ref(0)
  const secondsLeft = ref(0)
  const totalLeft = ref(o.totalSeconds ?? 0)
  const flashState = ref<'good' | 'bad' | ''>('')
  const loadError = ref('')

  let roundStart = 0
  let gameStart = 0
  let ticker: ReturnType<typeof setInterval> | undefined
  onBeforeUnmount(() => clearInterval(ticker))

  const round = computed(() => rounds.value[idx.value])
  const accuracy = computed(() =>
    idx.value ? Math.round((correct.value / Math.max(1, Math.min(idx.value, rounds.value.length))) * 1000) / 10 : 0
  )

  async function start() {
    loadError.value = ''
    try {
      const res = await $fetch<{ rounds: R[] }>(`/api/games/rounds/${o.gameId}`, { query: { difficulty: difficulty.value } })
      rounds.value = res.rounds
    } catch (e: any) {
      loadError.value = e?.data?.statusMessage || 'بارگذاری بازی انجام نشد'
      return
    }
    idx.value = 0
    score.value = correct.value = 0
    totalLeft.value = o.totalSeconds ?? 0
    countdown(() => {
      gameStart = Date.now()
      beginRound()
      ticker = setInterval(tick, 200)
    })
  }

  function beginRound() {
    roundStart = Date.now()
    secondsLeft.value = o.seconds(difficulty.value)
  }

  function tick() {
    const left = o.seconds(difficulty.value) - (Date.now() - roundStart) / 1000
    secondsLeft.value = Math.max(0, left)
    if (o.totalSeconds) {
      totalLeft.value = Math.max(0, o.totalSeconds - Math.floor((Date.now() - gameStart) / 1000))
      if (totalLeft.value <= 0) return end()
    }
    if (left <= 0) answer(undefined) // پایان مهلت = پاسخ غلط
  }

  function answer(choice: unknown) {
    if (phase.value !== 'playing' || !round.value) return
    const ok = choice !== undefined && o.judge(round.value, choice)
    if (ok) correct.value++
    score.value = Math.max(0, score.value + o.delta(ok, secondsLeft.value))
    flashState.value = ok ? 'good' : 'bad'
    setTimeout(() => (flashState.value = ''), 250)
    idx.value++
    if (idx.value >= rounds.value.length) return end()
    beginRound()
  }

  function end() {
    if (phase.value === 'done') return
    clearInterval(ticker)
    finish({ rawScore: score.value, accuracy: accuracy.value, duration: Date.now() - gameStart })
  }

  return { ...flow, rounds, idx, round, score, correct, secondsLeft, totalLeft, flashState, loadError, accuracy, start, answer }
}
