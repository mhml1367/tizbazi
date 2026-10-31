export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const rows = await prisma.score.groupBy({
    by: ['gameId'],
    where: { userId: user.id },
    _max: { rawScore: true },
    _count: { _all: true }
  })
  return { best: rows.map((r) => ({ gameId: r.gameId, best: r._max.rawScore ?? 0, played: r._count._all })) }
})
