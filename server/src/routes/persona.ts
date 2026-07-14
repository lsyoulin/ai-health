import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { authRequired } from '../middleware/auth.js'

const router = Router()
router.use(authRequired)

const upsertSchema = z.object({
  name: z.string().min(1).max(32),
  relation: z.enum(['self', 'parent', 'spouse', 'other']),
  condition: z.enum(['diabetes', 'hypertension', 'diabetes_hypertension', 'healthy']),
  stage: z.string().optional(),
  bloodGlucoseTarget: z.object({ fasting: z.number(), postprandial: z.number() }).optional(),
  bloodPressureTarget: z.object({ systolic: z.number(), diastolic: z.number() }).optional(),
  medications: z.array(z.string()).default([]),
})

// 我的 Persona 列表
router.get('/', async (req, res, next) => {
  try {
    const personas = await prisma.persona.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'asc' },
    })
    res.json({ personas })
  } catch (err) {
    next(err)
  }
})

// 创建
router.post('/', async (req, res, next) => {
  try {
    const parsed = upsertSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: '输入不合法', details: parsed.error.flatten() })
    }
    const persona = await prisma.persona.create({
      data: { ...parsed.data, userId: req.user!.userId },
    })
    res.status(201).json({ persona })
  } catch (err) {
    next(err)
  }
})

// 更新
router.put('/:id', async (req, res, next) => {
  try {
    const parsed = upsertSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: '输入不合法', details: parsed.error.flatten() })
    }
    const persona = await prisma.persona.updateMany({
      where: { id: req.params.id, userId: req.user!.userId },
      data: parsed.data,
    })
    if (persona.count === 0) return res.status(404).json({ error: 'Persona 不存在' })
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

// 删除
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await prisma.persona.deleteMany({
      where: { id: req.params.id, userId: req.user!.userId },
    })
    if (result.count === 0) return res.status(404).json({ error: 'Persona 不存在' })
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

export default router
