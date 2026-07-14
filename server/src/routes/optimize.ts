import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { authRequired, authOptional } from '../middleware/auth.js'
import { attachDisclaimer } from '../middleware/disclaimer.js'
import {
  optimizeMeal,
  simulateAdjustment,
  type MealItem,
  type SimulationInput,
} from '../services/optimizer.js'

const router = Router()

// ============ 验证 Schema ============

const optimizeItemSchema = z.object({
  foodId: z.string(),
  amountG: z.number().positive().max(2000),
})

const optimizeSchema = z.object({
  personaId: z.string().optional(),
  items: z.array(optimizeItemSchema).min(1).max(20),
})

const simulateSchema = z.object({
  personaId: z.string().optional(),
  items: z.array(optimizeItemSchema).min(1).max(20),
  simulation: z.object({
    carbReduction: z.number().min(0).max(0.8).optional(),
    addVegetable: z.boolean().optional(),
    exercise: z.number().min(0).max(120).optional(),
    replaceStaple: z.boolean().optional(),
    changeOrder: z.boolean().optional(),
  }),
})

// ============ 路由 ============

// 分析并优化一餐
router.post('/', authOptional, async (req, res, next) => {
  try {
    const parsed = optimizeSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: '输入不合法', details: parsed.error.flatten() })
    }
    const { personaId, items } = parsed.data

    // 查询食物数据
    const foodIds = items.map((i) => i.foodId)
    const foods = await prisma.food.findMany({
      where: { id: { in: foodIds } },
    })

    if (foods.length !== foodIds.length) {
      const missing = foodIds.filter((id) => !foods.find((f) => f.id === id))
      return res.status(400).json({ error: `食物不存在: ${missing.join(', ')}` })
    }

    // 组装 MealItem
    const mealItems: MealItem[] = items.map((i) => ({
      food: foods.find((f) => f.id === i.foodId)!,
      amountG: i.amountG,
    }))

    // 查询 Persona
    let persona
    if (personaId) {
      // 如果登录用户，检查 Persona 所有权
      const where: { id: string; userId?: string } = { id: personaId }
      if (req.user) {
        where.userId = req.user.userId
      }
      persona = await prisma.persona.findFirst({ where })
      if (!persona) {
        return res.status(404).json({ error: 'Persona 不存在' })
      }
    } else {
      // 默认使用糖尿病 Persona（演示用）
      persona = await prisma.persona.findFirst({
        where: { condition: 'diabetes' },
        orderBy: { createdAt: 'asc' },
      })
      if (!persona) {
        return res.status(404).json({ error: '未找到默认 Persona，请先 seed 数据' })
      }
    }

    // 执行优化
    const result = optimizeMeal(mealItems, persona)
    const payload = { result, persona: { id: persona.id, name: persona.name, condition: persona.condition } }
    const withDisclaimer = await attachDisclaimer(req, res, payload)
    res.json(withDisclaimer)
  } catch (err) {
    next(err)
  }
})

// 决策推演
router.post('/simulate', authOptional, async (req, res, next) => {
  try {
    const parsed = simulateSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: '输入不合法', details: parsed.error.flatten() })
    }
    const { personaId, items, simulation } = parsed.data

    // 查询食物
    const foodIds = items.map((i) => i.foodId)
    const foods = await prisma.food.findMany({ where: { id: { in: foodIds } } })
    if (foods.length !== foodIds.length) {
      return res.status(400).json({ error: '部分食物不存在' })
    }

    const mealItems: MealItem[] = items.map((i) => ({
      food: foods.find((f) => f.id === i.foodId)!,
      amountG: i.amountG,
    }))

    // 查询 Persona
    let persona
    if (personaId) {
      const where: { id: string; userId?: string } = { id: personaId }
      if (req.user) {
        where.userId = req.user.userId
      }
      persona = await prisma.persona.findFirst({ where })
      if (!persona) return res.status(404).json({ error: 'Persona 不存在' })
    } else {
      persona = await prisma.persona.findFirst({
        where: { condition: 'diabetes' },
        orderBy: { createdAt: 'asc' },
      })
      if (!persona) return res.status(404).json({ error: '未找到默认 Persona' })
    }

    // 执行推演
    const simInput: SimulationInput = {
      carbReduction: simulation.carbReduction,
      addVegetable: simulation.addVegetable,
      exercise: simulation.exercise,
      replaceStaple: simulation.replaceStaple,
      changeOrder: simulation.changeOrder,
    }
    const baseline = optimizeMeal(mealItems, persona)
    const adjusted = simulateAdjustment(mealItems, persona, simInput)

    const payload = {
      baseline: {
        predictedGlucose: baseline.prediction.predictedGlucose,
        glucoseDelta: baseline.prediction.glucoseDelta,
        riskLevel: baseline.prediction.riskLevel,
      },
      adjusted: {
        predictedGlucose: adjusted.predictedGlucose,
        glucoseDelta: adjusted.glucoseDelta,
        exerciseDelta: adjusted.exerciseDelta,
        totalNutrition: adjusted.totalNutrition,
      },
      improvement: Math.round(
        (baseline.prediction.predictedGlucose - adjusted.predictedGlucose) * 10
      ) / 10,
      persona: { id: persona.id, name: persona.name, condition: persona.condition },
    }
    const withDisclaimer = await attachDisclaimer(req, res, payload)
    res.json(withDisclaimer)
  } catch (err) {
    next(err)
  }
})

export default router
