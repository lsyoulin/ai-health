import { Router } from 'express'
import { prisma } from '../lib/prisma.js'

const router = Router()

// 列表（支持分类过滤）
router.get('/', async (req, res, next) => {
  try {
    const { category, type, limit } = req.query
    const take = Math.min(Number(limit) || 50, 200)
    const cards = await prisma.knowledgeCard.findMany({
      where: {
        AND: [
          category ? { category: String(category) } : {},
          type ? { type: String(type) } : {},
        ],
      },
      take,
      orderBy: { createdAt: 'desc' },
    })
    res.json({ cards })
  } catch (err) {
    next(err)
  }
})

// 详情
router.get('/:id', async (req, res, next) => {
  try {
    const card = await prisma.knowledgeCard.findUnique({ where: { id: req.params.id } })
    if (!card) return res.status(404).json({ error: '知识卡不存在' })
    res.json({ card })
  } catch (err) {
    next(err)
  }
})

export default router
