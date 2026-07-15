/**
 * 知食 · 前端 API 适配层
 *
 * 职责：
 * 1. 加载后端食物库，建立"后端食物名 → id"映射
 * 2. 将前端组合菜（如"白米饭+红烧肉"）映射到后端多个食物 id
 * 3. 调用后端 /api/optimize 和 /api/optimize/simulate
 * 4. 后端不可用时降级到本地 healthEngine
 *
 * 这样 React 组件可以渐进式从本地 healthEngine 迁移到后端 API。
 */

import type { Food, Persona, AnalysisResult } from '../store/useStore'
import { getRiskLevel } from '../store/useStore'
import { analyzeFood, simulateAdjustment } from './healthEngine'

const API_BASE = 'http://localhost:3001/api'

// ===== 后端食物名 → id 映射 =====
const foodNameToId = new Map<string, string>()
let backendReady = false

// ===== 前端组合菜 → 后端食物组合映射 =====
// key: 前端 food.id; value: 后端食物名列表 + 每份克数
const FOOD_COMPOSITION: Record<string, Array<{ name: string; amountG: number }>> = {
  beef_noodle: [{ name: '牛肉面', amountG: 400 }],
  rice_braised_pork: [
    { name: '白米饭', amountG: 200 },
    { name: '红烧肉', amountG: 100 },
  ],
  porridge_cucumber: [
    { name: '杂粮粥', amountG: 300 },
    { name: '凉拌黄瓜', amountG: 150 },
  ],
  mala_xiangguo: [{ name: '麻辣香锅', amountG: 400 }],
  tomato_egg_rice: [
    { name: '白米饭', amountG: 200 },
    { name: '西红柿炒蛋', amountG: 150 },
  ],
  steamed_pumpkin: [{ name: '蒸南瓜', amountG: 200 }],
  dumplings: [{ name: '猪肉韭菜饺子', amountG: 250 }],
  braised_noodles: [{ name: '炒饼', amountG: 300 }],
  fried_chicken: [{ name: '炸鸡', amountG: 200 }],
  steamed_fish: [
    { name: '清蒸鱼', amountG: 200 },
    { name: '白米饭', amountG: 100 },
  ],
  congee_pickles: [
    { name: '白米粥', amountG: 300 },
    { name: '咸菜', amountG: 50 },
  ],
  fruit_plate: [{ name: '水果拼盘', amountG: 300 }],
}

// ===== Persona 类型 → 后端 Persona id 映射 =====
const personaConditionMap: Record<string, string> = {
  diabetes: 'diabetes',
  hypertension: 'hypertension',
  diabetes_hypertension: 'diabetes_hypertension',
  healthy: 'healthy',
}

let personaIdCache: Record<string, string | null> = {}

// ===== 初始化：加载后端食物库 =====
export async function initBackendData() {
  if (backendReady) return
  try {
    const res = await fetch(`${API_BASE}/foods?limit=500`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const foods: Array<{ id: string; name: string }> = await res.json()
    for (const f of foods) {
      foodNameToId.set(f.name, f.id)
    }
    backendReady = true
    console.log(`✓ 后端食物库已加载: ${foods.length} 种`)
  } catch (err) {
    console.warn('⚠️  后端食物库加载失败，将使用本地引擎:', err)
    backendReady = false
  }
}

// ===== 通过前端 food.id 获取后端 food items =====
async function getBackendItems(frontendFoodId: string): Promise<Array<{ foodId: string; amountG: number }> | null> {
  const composition = FOOD_COMPOSITION[frontendFoodId]
  if (!composition) return null

  const items: Array<{ foodId: string; amountG: number }> = []
  for (const part of composition) {
    const backendId = foodNameToId.get(part.name)
    if (!backendId) {
      console.warn(`后端食物未找到: ${part.name}`)
      return null
    }
    items.push({ foodId: backendId, amountG: part.amountG })
  }
  return items
}

// ===== 获取后端 Persona id（通过 condition 匹配） =====
async function getBackendPersonaId(persona: Persona): Promise<string | null> {
  const condition = personaConditionMap[persona.type]
  if (!condition) return null

  if (personaIdCache[condition] !== undefined) {
    return personaIdCache[condition]
  }

  try {
    // 获取 demo user 的 Persona 列表
    const res = await fetch(`${API_BASE}/personas`, {
      headers: { 'Content-Type': 'application/json' },
    })
    if (!res.ok) {
      personaIdCache[condition] = null
      return null
    }
    const personas: Array<{ id: string; condition: string }> = await res.json()
    const matched = personas.find((p) => p.condition === condition)
    personaIdCache[condition] = matched?.id || null
    return personaIdCache[condition]
  } catch {
    personaIdCache[condition] = null
    return null
  }
}

// ===== 后端分析结果 → 前端 AnalysisResult 适配 =====
interface BackendOptimizeResponse {
  result: {
    prediction: {
      predictedGlucose: number
      glucoseDelta: number
      predictedBpChange: number
      riskLevel: 'safe' | 'warning' | 'danger'
      totalNutrition: {
        calories: number
        carbs: number
        protein: number
        fat: number
        sodium: number
        weightedGI: number
      }
    }
    optimization: {
      score: number
      adjustments: Array<{
        type: string
        description: string
        targetFoodName?: string
        impact: { glucoseDelta: number; bpDelta: number }
        priority: 'high' | 'medium' | 'low'
      }>
    }
    suggestions: string[]
  }
  persona: { id: string; name: string; condition: string }
  disclaimer?: { text: string; version: string; docType: string }
}

function adaptBackendResult(
  backend: BackendOptimizeResponse,
  food: Food,
  persona: Persona
): AnalysisResult {
  const pred = backend.result.prediction
  return {
    foodId: food.id,
    personaId: persona.id,
    predictedGlucose: pred.predictedGlucose,
    glucoseDelta: pred.glucoseDelta,
    predictedBpChange: pred.predictedBpChange,
    riskLevel: pred.riskLevel,
    suggestion: backend.result.suggestions[0] || '',
    suggestions: backend.result.suggestions,
  }
}

// ===== 对外接口：analyzeFood（优先用后端，降级到本地） =====
export async function analyzeFoodBackend(
  food: Food,
  persona: Persona
): Promise<{ result: AnalysisResult; disclaimer?: { text: string; version: string; docType: string } }> {
  // 确保后端数据已初始化
  if (!backendReady) {
    await initBackendData()
  }

  if (!backendReady) {
    return { result: analyzeFood(food, persona) }
  }

  const items = await getBackendItems(food.id)
  if (!items) {
    return { result: analyzeFood(food, persona) }
  }

  const personaId = await getBackendPersonaId(persona)

  try {
    const res = await fetch(`${API_BASE}/optimize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personaId: personaId || undefined, items }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data: BackendOptimizeResponse = await res.json()
    return {
      result: adaptBackendResult(data, food, persona),
      disclaimer: data.disclaimer,
    }
  } catch (err) {
    console.warn('⚠️  后端 optimize 调用失败，降级到本地引擎:', err)
    return { result: analyzeFood(food, persona) }
  }
}

// ===== 对外接口：simulateAdjustment（决策推演） =====
export interface SimulateResult {
  predictedGlucose: number
  delta: number
  exerciseDelta: number
  riskLevel: 'safe' | 'warning' | 'danger'
  disclaimer?: { text: string; version: string; docType: string }
}

export async function simulateAdjustmentBackend(
  food: Food,
  persona: Persona,
  adjustment: {
    carbReduction?: number
    addVegetable?: boolean
    exercise?: number
  }
): Promise<SimulateResult> {
  if (!backendReady) {
    await initBackendData()
  }

  if (!backendReady) {
    const local = simulateAdjustment(food, persona, adjustment)
    return {
      ...local,
      riskLevel: getRiskLevel(local.predictedGlucose),
    }
  }

  const items = await getBackendItems(food.id)
  if (!items) {
    const local = simulateAdjustment(food, persona, adjustment)
    return {
      ...local,
      riskLevel: getRiskLevel(local.predictedGlucose),
    }
  }

  const personaId = await getBackendPersonaId(persona)

  try {
    const res = await fetch(`${API_BASE}/optimize/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personaId: personaId || undefined,
        items,
        simulation: {
          carbReduction: adjustment.carbReduction,
          addVegetable: adjustment.addVegetable,
          exercise: adjustment.exercise,
        },
      }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return {
      predictedGlucose: data.adjusted.predictedGlucose,
      delta: data.adjusted.glucoseDelta,
      exerciseDelta: data.adjusted.exerciseDelta || 0,
      riskLevel: getRiskLevel(data.adjusted.predictedGlucose),
      disclaimer: data.disclaimer,
    }
  } catch (err) {
    console.warn('⚠️  后端 simulate 调用失败，降级到本地引擎:', err)
    const local = simulateAdjustment(food, persona, adjustment)
    return {
      ...local,
      riskLevel: getRiskLevel(local.predictedGlucose),
    }
  }
}

// ===== 检查后端是否可用 =====
export function isBackendReady(): boolean {
  return backendReady
}

// ===== 获取免责声明（用于页面底部展示） =====
export async function getDisclaimer(): Promise<{ text: string; version: string } | null> {
  try {
    const res = await fetch(`${API_BASE}/legal/docs/disclaimer`)
    if (!res.ok) return null
    const data = await res.json()
    return {
      text: data.doc.content,
      version: data.doc.version,
    }
  } catch {
    return null
  }
}
