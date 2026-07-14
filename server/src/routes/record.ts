import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { authRequired } from '../middleware/auth.js'
import { attachDisclaimer } from '../middleware/disclaimer.js'

const router = Router()
router.use(authRequired)

const createItemSchema = z.object({
  foodId: z.string(),
  amountG: z.number().positive().max(2000),
  order: z.number().int().min(1).default(1),
})

const createRecordSchema = z.object({
  personaId: z.string().optional(),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  mealTime: z.string().datetime().optional(),
  items: z.array(createItemSchema).min(1).max(20),
  predictedGlucose: z.number().optional(),
  predictedGlucoseRange: z.object({ min: z.number(), max: z.number() }).optional(),
  optimization: z.any().optional(),
  notes: z.string().max(500).optional(),
})

// 创建记录
router.post('/', async (req, res, next) => {
  try {
    const parsed = createRecordSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: '输入不合法', details: parsed.error.flatten() })
    }
    const data = parsed.data
    const record = await prisma.foodRecord.create({
      data: {
        userId: req.user!.userId,
        personaId: data.personaId,
        mealType: data.mealType,
        mealTime: data.mealTime ? new Date(data.mealTime) : new Date(),
        predictedGlucose: data.predictedGlucose,
        predictedGlucoseRange: data.predictedGlucoseRange,
        optimization: data.optimization,
        notes: data.notes,
        items: {
          create: data.items.map((it) => ({
            foodId: it.foodId,
            amountG: it.amountG,
            order: it.order,
          })),
        },
      },
      include: { items: { include: { food: true } } },
    })
    const withDisclaimer = await attachDisclaimer(req, res, { record })
    res.status(201).json(withDisclaimer)
  } catch (err) {
    next(err)
  }
})

// 我的记录列表
router.get('/', async (req, res, next) => {
  try {
    const { personaId, from, to, limit } = req.query
    const take = Math.min(Number(limit) || 30, 100)
    const records = await prisma.foodRecord.findMany({
      where: {
        userId: req.user!.userId,
        AND: [
          personaId ? { personaId: String(personaId) } : {},
          from ? { mealTime: { gte: new Date(String(from)) } } : {},
          to ? { mealTime: { lte: new Date(String(to)) } } : {},
        ],
      },
      take,
      orderBy: { mealTime: 'desc' },
      include: { items: { include: { food: true } } },
    })
    res.json({ records })
  } catch (err) {
    next(err)
  }
})

// 详情
router.get('/:id', async (req, res, next) => {
  try {
    const record = await prisma.foodRecord.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
      include: { items: { include: { food: true } } },
    })
    if (!record) return res.status(404).json({ error: '记录不存在' })
    res.json({ record })
  } catch (err) {
    next(err)
  }
})

// 更新实际血糖
router.patch('/:id', async (req, res, next) => {
  try {
    const { actualGlucose } = req.body as { actualGlucose?: number }
    if (typeof actualGlucose !== 'number') {
      return res.status(400).json({ error: 'actualGlucose 必填' })
    }
    const record = await prisma.foodRecord.updateMany({
      where: { id: req.params.id, userId: req.user!.userId },
      data: { actualGlucose },
    })
    if (record.count === 0) return res.status(404).json({ error: '记录不存在' })
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

// 删除
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await prisma.foodRecord.deleteMany({
      where: { id: req.params.id, userId: req.user!.userId },
    })
    if (result.count === 0) return res.status(404).json({ error: '记录不存在' })
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

export default router
