import { randomUUID } from 'node:crypto'
import { prisma } from './db'
import { getContent } from './content'
import { tehranDayKey } from '#shared/gamification'
import { WD, dailyIndex, markGuess } from '#shared/games/wordle'

export type WordleMode = 'daily' | 'practice'
const GAME = 'word-of-day'

/** معمای فعلی کاربر؛ تمرینی جدید فقط با fresh=true یا وقتی هیچ تمرینی نیست ساخته می‌شود */
export async function getPuzzle(userId: string, mode: WordleMode, fresh = false) {
  const answers = await getContent<string[]>('wordle-answers')
  if (mode === 'daily') {
    const key = tehranDayKey()
    return prisma.dailyPuzzle.upsert({
      where: { userId_game_key: { userId, game: GAME, key } },
      create: { userId, game: GAME, key, answer: answers[dailyIndex(key, answers.length)]!, guesses: [] },
      update: {}
    })
  }
  if (!fresh) {
    const last = await prisma.dailyPuzzle.findFirst({
      where: { userId, game: GAME, key: { startsWith: 'practice:' } },
      orderBy: { createdAt: 'desc' }
    })
    if (last) return last
  }
  return prisma.dailyPuzzle.create({
    data: { userId, game: GAME, key: `practice:${randomUUID()}`, answer: answers[Math.floor(Math.random() * answers.length)]!, guesses: [] }
  })
}

/** نمای امن برای کلاینت: جواب فقط پس از پایان فرستاده می‌شود */
export function publicPuzzle(p: { key: string; answer: string; guesses: string[]; solved: boolean; finished: boolean }) {
  return {
    mode: p.key.startsWith('practice:') ? 'practice' : 'daily',
    day: p.key.startsWith('practice:') ? null : p.key,
    rows: p.guesses.map((word) => ({ word, marks: markGuess(word, p.answer) })),
    solved: p.solved,
    finished: p.finished,
    maxGuesses: WD.maxGuesses,
    answer: p.finished ? p.answer : null
  }
}
