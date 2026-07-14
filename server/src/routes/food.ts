import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authOptional } from '../middleware/auth.js'

const router = Router()

// 列表（支持搜索与分类过滤）
router.get('/', authOptional, async (req, res, next) => {
  try {
    const { q, category, limit } = req.query
    const take = Math.min(Number(limit) || 50, 200)

    const foods = await prisma.food.findMany({
      where: {
        AND: [
          q ? { name: { contains: String(q), mode: 'insensitive' } } : {},
          category ? { category: String(category) } : {},
        ],
      },
      take,
      orderBy: { name: 'asc' },
    })
    res.json({ foods })
  } catch (err) {
    next(err)
  }
})

// 详情
router.get('/:id', async (req, res, next) => {
  try {
    const food = await prisma.food.findUnique({ where: { id: req.params.id } })
    if (!food) return res.status(404).json({ error: '食物不存在' })
    res.json({ food })
  } catch (err) {
    next(err)
  }
})

export default router
