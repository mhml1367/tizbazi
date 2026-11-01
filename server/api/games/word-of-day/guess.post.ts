import { z } from 'zod'
import { compareKey } from '#shared/persian'
import { WD, isFiveLetters, wordleScore } from '#shared/games/wordle'

const body = z.object({ mode: z.enum(['daily', 'practice']), guess: z.string().max(20) })

/**
 * ثبت یک حدس. سرور جواب را نگه می‌دارد، تعداد حدس را محدود می‌کند و در پایان امتیاز را خودش ثبت می‌کند
 * (کلاینت امتیاز این بازی را نمی‌فرستد).
 */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const p = body.safeParse(await readBody(event))
  if (!p.success) throw createError({ statusCode: 400, statusMessage: p.error.issues[0]!.message })

  const puzzle = await getPuzzle(user.id, p.data.mode)
  if (puzzle.finished) throw createError({ statusCode: 409, statusMessage: 'این معما تمام شده است' })

  const guess = compareKey(p.data.guess)
  if (!isFiveLetters(guess)) throw createError({ statusCode: 400, statusMessage: 'کلمه باید دقیقاً ۵ حرف باشد' })
  const dictionary = await getDictionary()
  const answers = await getContent<string[]>('wordle-answers')
  if (!dictionary.has(guess) && !answers.includes(guess)) {
    throw createError({ statusCode: 422, statusMessage: 'این کلمه در واژه‌نامه نیست' })
  }

  const guesses = [...puzzle.guesses, guess]
  const solved = guess === puzzle.answer
  const finished = solved || guesses.length >= WD.maxGuesses
  const updated = await prisma.dailyPuzzle.update({ where: { id: puzzle.id }, data: { guesses, solved, finished } })

  let reward = null
  if (finished) {
    reward = await recordScore(user.id, {
      gameId: 'word-of-day',
      rawScore: wordleScore(solved, guesses.length),
      accuracy: solved ? 100 : 0,
      duration: Math.min(Date.now() - puzzle.createdAt.getTime(), 30 * 60 * 1000),
      difficulty: 1
    })
  }
  return { ...publicPuzzle(updated), reward }
})
