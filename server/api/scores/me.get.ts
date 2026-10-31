export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const scores = await prisma.score.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50
  })
  return { scores }
})
