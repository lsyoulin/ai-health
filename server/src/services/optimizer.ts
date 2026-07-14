/**
 * 知食 · 饮食组合优化器
 *
 * 核心算法：
 * 1. 预测阶段：基于食物组合 + Persona 预测餐后血糖/血压影响
 * 2. 优化阶段：贪心 + 规则约束，生成 Top5 优化建议
 * 3. 建议生成：基于 Persona 类型生成个性化自然语言建议
 *
 * 设计原则：
 * - 主目标：血糖控制
 * - 辅目标：血压控制 + 饱腹感
 * - 实时优化：<1 秒完成
 *
 * 医疗声明：
 * 本算法基于营养学与慢病病理学的简化模型，仅供辅助决策参考。
 * 实际医疗决策应咨询专业医师。
 */

import type { Food, Persona } from '@prisma/client'

// ============ 类型定义 ============

export interface MealItem {
  food: Food
  amountG: number
}

export interface MealNutrition {
  calories: number
  carbs: number
  protein: number
  fat: number
  fiber: number
  sodium: number
  potassium: number
  // 加权平均 GI（按碳水权重）
  weightedGI: number
  // 血糖负荷
  gl: number
}

export interface MealPrediction {
  totalNutrition: MealNutrition
  predictedGlucose: number
  glucoseDelta: number
  predictedBpChange: number
  riskLevel: 'safe' | 'warning' | 'danger'
}

export type AdjustmentType =
  | 'reduce_carb'
  | 'replace_high_gi'
  | 'reduce_sodium'
  | 'add_vegetable'
  | 'add_exercise'
  | 'reduce_portion'
  | 'change_order'

export interface OptimizationAdjustment {
  type: AdjustmentType
  description: string
  targetFoodName?: string
  impact: {
    glucoseDelta: number // 负数表示降低
    bpDelta: number
  }
  priority: 'high' | 'medium' | 'low'
}

export interface OptimizationResult {
  prediction: MealPrediction
  optimization: {
    score: number // 0-100 综合评分
    adjustments: OptimizationAdjustment[]
    optimizedPrediction: MealPrediction
  }
  suggestions: string[]
}

// ============ Persona 敏感度系数 ============

interface PersonaSensitivity {
  glucoseSensitivity: number // 0.5-2.0
  sodiumSensitivity: number // 0.5-2.0
  fastingGlucose: number
  postprandialTarget: number
  bpTarget: { systolic: number; diastolic: number }
}

function getPersonaSensitivity(persona: Persona): PersonaSensitivity {
  // 根据 Persona 的 condition 和目标值计算敏感度
  const bgTarget = persona.bloodGlucoseTarget as { fasting?: number; postprandial?: number } | null
  const bpTarget = persona.bloodPressureTarget as { systolic?: number; diastolic?: number } | null

  const fasting = bgTarget?.fasting ?? 6.1
  const postprandial = bgTarget?.postprandial ?? 7.8

  switch (persona.condition) {
    case 'diabetes':
      return {
        glucoseSensitivity: 1.4,
        sodiumSensitivity: 0.8,
        fastingGlucose: fasting,
        postprandialTarget: postprandial,
        bpTarget: { systolic: bpTarget?.systolic ?? 130, diastolic: bpTarget?.diastolic ?? 80 },
      }
    case 'hypertension':
      return {
        glucoseSensitivity: 0.8,
        sodiumSensitivity: 1.5,
        fastingGlucose: fasting,
        postprandialTarget: postprandial,
        bpTarget: { systolic: bpTarget?.systolic ?? 135, diastolic: bpTarget?.diastolic ?? 85 },
      }
    case 'diabetes_hypertension':
      return {
        glucoseSensitivity: 1.5,
        sodiumSensitivity: 1.4,
        fastingGlucose: fasting,
        postprandialTarget: postprandial,
        bpTarget: { systolic: bpTarget?.systolic ?? 130, diastolic: bpTarget?.diastolic ?? 80 },
      }
    case 'healthy':
    default:
      return {
        glucoseSensitivity: 0.6,
        sodiumSensitivity: 0.6,
        fastingGlucose: 5.0,
        postprandialTarget: 7.8,
        bpTarget: { systolic: 120, diastolic: 80 },
      }
  }
}

// ============ 1. 营养计算 ============

export function calculateMealNutrition(items: MealItem[]): MealNutrition {
  let totalCalories = 0,
    totalCarbs = 0,
    totalProtein = 0,
    totalFat = 0,
    totalFiber = 0,
    totalSodium = 0,
    totalPotassium = 0

  // 加权 GI 计算（按碳水含量加权）
  let weightedGISum = 0,
    totalCarbsForGI = 0

  for (const item of items) {
    const ratio = item.amountG / 100 // 食物营养是每 100g 的值
    const f = item.food

    totalCalories += f.energyKcal * ratio
    totalCarbs += f.carbsG * ratio
    totalProtein += f.proteinG * ratio
    totalFat += f.fatG * ratio
    totalFiber += (f.fiberG ?? 0) * ratio
    totalSodium += (f.sodiumMg ?? 0) * ratio
    totalPotassium += (f.potassiumMg ?? 0) * ratio

    // GI 加权（只有有 GI 值且含碳水的食物才参与）
    if (f.gi != null && f.carbsG > 0) {
      weightedGISum += f.gi * f.carbsG * ratio
      totalCarbsForGI += f.carbsG * ratio
    }
  }

  const weightedGI = totalCarbsForGI > 0 ? Math.round(weightedGISum / totalCarbsForGI) : 0
  // 血糖负荷 GL = GI × 碳水g / 100
  const gl = Math.round((weightedGI * totalCarbs) / 100)

  return {
    calories: Math.round(totalCalories),
    carbs: Math.round(totalCarbs * 10) / 10,
    protein: Math.round(totalProtein * 10) / 10,
    fat: Math.round(totalFat * 10) / 10,
    fiber: Math.round(totalFiber * 10) / 10,
    sodium: Math.round(totalSodium),
    potassium: Math.round(totalPotassium),
    weightedGI,
    gl,
  }
}

// ============ 2. 健康预测 ============

export function predictMeal(items: MealItem[], persona: Persona): MealPrediction {
  const nutrition = calculateMealNutrition(items)
  const sens = getPersonaSensitivity(persona)

  // 血糖预测：基于碳水 + GI + 敏感度
  // 增量 = (碳水g × GI/100 × 敏感度) / 10
  const glucoseIncrease = (nutrition.carbs * (nutrition.weightedGI / 100) * sens.glucoseSensitivity) / 10
  const predictedGlucose = Math.round((sens.fastingGlucose + glucoseIncrease) * 10) / 10
  const glucoseDelta = Math.round(glucoseIncrease * 10) / 10

  // 血压预测：基于钠摄入
  // 增量 = (钠mg / 1000) × 敏感度 × 2.2
  const bpChange = Math.round(((nutrition.sodium / 1000) * sens.sodiumSensitivity * 2.2) * 10) / 10

  // 风险等级（基于血糖）
  let riskLevel: 'safe' | 'warning' | 'danger'
  if (persona.condition === 'healthy') {
    riskLevel = predictedGlucose < 7.8 ? 'safe' : predictedGlucose < 10 ? 'warning' : 'danger'
  } else {
    riskLevel = predictedGlucose < 8.0 ? 'safe' : predictedGlucose < 11.1 ? 'warning' : 'danger'
  }

  return {
    totalNutrition: nutrition,
    predictedGlucose,
    glucoseDelta,
    predictedBpChange: bpChange,
    riskLevel,
  }
}

// ============ 3. 组合优化器（贪心 + 规则约束） ============

export function optimizeMeal(items: MealItem[], persona: Persona): OptimizationResult {
  const prediction = predictMeal(items, persona)
  const sens = getPersonaSensitivity(persona)
  const adjustments: OptimizationAdjustment[] = []

  // 分析食物组成
  const stapleItems = items.filter((i) => i.food.category === '主食')
  const vegetableItems = items.filter((i) => i.food.category === '蔬菜')
  const meatItems = items.filter((i) => i.food.category === '肉类')
  const soupOrLiquidItems = items.filter(
    (i) => i.food.subcategory === '汤类' || i.food.name.includes('汤') || i.food.name.includes('粥')
  )

  // ===== 规则 1：碳水超标 → 减少主食分量 =====
  const carbThreshold = persona.condition === 'healthy' ? 80 : 60
  if (prediction.totalNutrition.carbs > carbThreshold && stapleItems.length > 0) {
    const mainStaple = stapleItems[0]
    const reductionRatio = 1 / 3
    const reducedCarbs = mainStaple.food.carbsG * (mainStaple.amountG / 100) * reductionRatio
    const glucoseImprovement = Math.round(
      ((reducedCarbs * (prediction.totalNutrition.weightedGI / 100) * sens.glucoseSensitivity) / 10) * 10
    ) / 10

    adjustments.push({
      type: 'reduce_carb',
      description: `减少「${mainStaple.food.name}」分量 1/3（约 ${Math.round(mainStaple.amountG * reductionRatio)}g）`,
      targetFoodName: mainStaple.food.name,
      impact: { glucoseDelta: -glucoseImprovement, bpDelta: 0 },
      priority: 'high',
    })
  }

  // ===== 规则 2：GI 过高 → 替换为低 GI 主食 =====
  if (prediction.totalNutrition.weightedGI >= 70 && stapleItems.length > 0) {
    const highGiStaple = stapleItems[0]
    // 低 GI 替换后血糖反应降低约 30-40%
    const glucoseImprovement = Math.round(
      (prediction.glucoseDelta * 0.35) * 10
    ) / 10

    adjustments.push({
      type: 'replace_high_gi',
      description: `将「${highGiStaple.food.name}」替换为低 GI 主食（如糙米饭、燕麦、杂粮饭），可降低血糖反应约 35%`,
      targetFoodName: highGiStaple.food.name,
      impact: { glucoseDelta: -glucoseImprovement, bpDelta: 0 },
      priority: 'high',
    })
  }

  // ===== 规则 3：钠超标 → 减少钠摄入 =====
  const sodiumThreshold = persona.condition === 'hypertension' || persona.condition === 'diabetes_hypertension' ? 1500 : 2000
  if (prediction.totalNutrition.sodium > sodiumThreshold) {
    // 如果有汤类/粥类，建议不喝汤
    if (soupOrLiquidItems.length > 0) {
      const soup = soupOrLiquidItems[0]
      const sodiumInSoup = (soup.food.sodiumMg ?? 0) * (soup.amountG / 100) * 0.5 // 汤中钠约 50%
      const bpImprovement = Math.round(((sodiumInSoup / 1000) * sens.sodiumSensitivity * 2.2) * 10) / 10

      adjustments.push({
        type: 'reduce_sodium',
        description: `「${soup.food.name}」含钠较高，建议不喝汤底/汤汁，可减少钠摄入约 ${Math.round(sodiumInSoup)}mg`,
        targetFoodName: soup.food.name,
        impact: { glucoseDelta: 0, bpDelta: -bpImprovement },
        priority: 'high',
      })
    } else {
      const bpImprovement = Math.round(((prediction.totalNutrition.sodium * 0.2 / 1000) * sens.sodiumSensitivity * 2.2) * 10) / 10
      adjustments.push({
        type: 'reduce_sodium',
        description: `本餐钠摄入 ${prediction.totalNutrition.sodium}mg 偏高，建议减少调味品用量或不喝菜汤`,
        impact: { glucoseDelta: 0, bpDelta: -bpImprovement },
        priority: 'medium',
      })
    }
  }

  // ===== 规则 4：蔬菜不足 → 增加蔬菜 =====
  const vegetableAmount = vegetableItems.reduce((sum, i) => sum + i.amountG, 0)
  if (vegetableAmount < 150) {
    // 增加蔬菜可降低整体 GI（纤维延缓血糖上升）
    const giImprovement = prediction.totalNutrition.weightedGI >= 55 ? 15 : 10
    const glucoseImprovement = Math.round(
      ((prediction.totalNutrition.carbs * (giImprovement / 100) * sens.glucoseSensitivity) / 10) * 10
    ) / 10

    adjustments.push({
      type: 'add_vegetable',
      description: `增加一份蔬菜（如凉拌黄瓜、清炒菠菜，约 150g），膳食纤维可延缓血糖上升`,
      impact: { glucoseDelta: -glucoseImprovement, bpDelta: 0 },
      priority: 'medium',
    })
  }

  // ===== 规则 5：热量超标 → 建议运动 =====
  const calorieThreshold = 700
  if (prediction.totalNutrition.calories > calorieThreshold) {
    const exerciseMinutes = 20
    // 每 20 分钟运动降低约 1.2 mmol/L 血糖
    const glucoseImprovement = 1.2

    adjustments.push({
      type: 'add_exercise',
      description: `本餐热量 ${prediction.totalNutrition.calories} kcal 偏高，建议餐后散步 ${exerciseMinutes} 分钟`,
      impact: { glucoseDelta: -glucoseImprovement, bpDelta: -0.5 },
      priority: 'medium',
    })
  }

  // ===== 规则 6：进餐顺序建议 =====
  if (items.length >= 3 && persona.condition !== 'healthy') {
    adjustments.push({
      type: 'change_order',
      description: '调整进餐顺序：先吃蔬菜 → 再吃肉类 → 最后吃主食，可降低餐后血糖峰值约 20-30%',
      impact: { glucoseDelta: -Math.round(prediction.glucoseDelta * 0.25 * 10) / 10, bpDelta: 0 },
      priority: 'low',
    })
  }

  // 按优先级排序
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  adjustments.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  // 计算优化后的预测
  let optimizedGlucose = prediction.predictedGlucose
  let optimizedBp = prediction.predictedBpChange
  for (const adj of adjustments.slice(0, 3)) {
    // 只取 Top3 影响最大的优化
    optimizedGlucose += adj.impact.glucoseDelta
    optimizedBp += adj.impact.bpDelta
  }
  optimizedGlucose = Math.max(sens.fastingGlucose, Math.round(optimizedGlucose * 10) / 10)

  const optimizedPrediction: MealPrediction = {
    ...prediction,
    predictedGlucose: optimizedGlucose,
    glucoseDelta: Math.round((optimizedGlucose - sens.fastingGlucose) * 10) / 10,
    predictedBpChange: Math.round(optimizedBp * 10) / 10,
    riskLevel:
      optimizedGlucose < 8.0 ? 'safe' : optimizedGlucose < 11.1 ? 'warning' : 'danger',
  }

  // 综合评分（0-100）
  const glucoseScore = Math.max(0, 100 - (optimizedGlucose - sens.fastingGlucose) * 10)
  const bpScore = Math.max(0, 100 - Math.abs(optimizedBp) * 20)
  const balanceScore = vegetableAmount >= 150 && meatItems.length >= 1 ? 100 : 60
  const score = Math.round(glucoseScore * 0.5 + bpScore * 0.3 + balanceScore * 0.2)

  // 生成自然语言建议
  const suggestions = generateSuggestions(prediction, optimizedPrediction, adjustments, persona, sens)

  return {
    prediction,
    optimization: {
      score,
      adjustments: adjustments.slice(0, 5),
      optimizedPrediction,
    },
    suggestions,
  }
}

// ============ 4. 自然语言建议生成 ============

function generateSuggestions(
  prediction: MealPrediction,
  optimized: MealPrediction,
  adjustments: OptimizationAdjustment[],
  persona: Persona,
  sens: PersonaSensitivity
): string[] {
  const suggestions: string[] = []
  const personaLabel = getPersonaLabel(persona.condition)
  const risk = prediction.riskLevel

  // 主建议
  if (risk === 'danger') {
    suggestions.push(
      `⚠️ 对您（${personaLabel}）而言，本餐预计让餐后血糖升至 ${prediction.predictedGlucose} mmol/L（↑${prediction.glucoseDelta}），超出安全范围。`
    )
  } else if (risk === 'warning') {
    suggestions.push(
      `⚡ 对您（${personaLabel}）而言，本餐预计让餐后血糖升至 ${prediction.predictedGlucose} mmol/L（↑${prediction.glucoseDelta}），处于临界值。`
    )
  } else {
    suggestions.push(
      `✅ 对您（${personaLabel}）而言，本餐预计让餐后血糖升至 ${prediction.predictedGlucose} mmol/L（↑${prediction.glucoseDelta}），处于安全范围。`
    )
  }

  // 血压建议
  if (prediction.predictedBpChange > 2 && (persona.condition === 'hypertension' || persona.condition === 'diabetes_hypertension')) {
    suggestions.push(
      `本餐钠摄入 ${prediction.totalNutrition.sodium}mg，预计让血压上升约 ${prediction.predictedBpChange} mmHg，建议控制调味品用量。`
    )
  }

  // 优化效果汇总
  if (adjustments.length > 0) {
    const glucoseImprovement = prediction.predictedGlucose - optimized.predictedGlucose
    if (glucoseImprovement > 0.3) {
      suggestions.push(
        `💡 按照以下建议调整后，餐后血糖可降至 ${optimized.predictedGlucose} mmol/L（降低 ${Math.round(glucoseImprovement * 10) / 10} mmol/L）。`
      )
    }
  }

  // 高优先级建议
  const highPriority = adjustments.filter((a) => a.priority === 'high')
  if (highPriority.length > 0) {
    suggestions.push(`📌 优先建议：${highPriority[0].description}。`)
  }

  // 健康人
  if (persona.condition === 'healthy' && risk === 'safe') {
    suggestions.push('本餐影响可控，建议保持均衡饮食与规律运动。')
  }

  return suggestions
}

function getPersonaLabel(condition: string): string {
  switch (condition) {
    case 'diabetes':
      return '2 型糖尿病'
    case 'hypertension':
      return '高血压'
    case 'diabetes_hypertension':
      return '糖尿病+高血压'
    case 'healthy':
      return '健康人'
    default:
      return '用户'
  }
}

// ============ 5. 决策推演（单个变量调整） ============

export interface SimulationInput {
  carbReduction?: number // 0-1 减少碳水比例
  addVegetable?: boolean // 增加蔬菜
  exercise?: number // 餐后运动分钟数
  replaceStaple?: boolean // 替换为低 GI 主食
  changeOrder?: boolean // 调整进餐顺序
}

export function simulateAdjustment(
  items: MealItem[],
  persona: Persona,
  input: SimulationInput
): {
  predictedGlucose: number
  glucoseDelta: number
  exerciseDelta: number
  totalNutrition: MealNutrition
} {
  const sens = getPersonaSensitivity(persona)

  // 复制并调整食物
  const adjustedItems: MealItem[] = items.map((i) => ({ ...i, food: { ...i.food } }))

  // 减少碳水
  if (input.carbReduction) {
    for (const item of adjustedItems) {
      if (item.food.category === '主食') {
        item.amountG *= 1 - input.carbReduction
      }
    }
  }

  // 替换为低 GI 主食
  if (input.replaceStaple) {
    for (const item of adjustedItems) {
      if (item.food.category === '主食' && item.food.gi) {
        // 低 GI 主食 GI 值约 50
        item.food = { ...item.food, gi: Math.min(50, item.food.gi) }
      }
    }
  }

  // 增加蔬菜 → 降低整体 GI
  if (input.addVegetable) {
    for (const item of adjustedItems) {
      if (item.food.gi) {
        item.food = { ...item.food, gi: Math.max(40, item.food.gi - 15) }
      }
    }
  }

  // 调整进餐顺序 → 降低血糖峰值 25%
  const orderFactor = input.changeOrder ? 0.75 : 1.0

  // 营养计算
  const nutrition = calculateMealNutrition(adjustedItems)

  // 血糖预测
  const baseIncrease = (nutrition.carbs * (nutrition.weightedGI / 100) * sens.glucoseSensitivity * orderFactor) / 10
  const predictedGlucose = Math.round((sens.fastingGlucose + baseIncrease) * 10) / 10

  // 运动降血糖
  const exerciseDelta = input.exercise ? Math.round((input.exercise / 20 * 1.2) * 10) / 10 : 0
  const finalGlucose = Math.max(sens.fastingGlucose, predictedGlucose - exerciseDelta)

  return {
    predictedGlucose: Math.round(finalGlucose * 10) / 10,
    glucoseDelta: Math.round((finalGlucose - sens.fastingGlucose) * 10) / 10,
    exerciseDelta,
    totalNutrition: nutrition,
  }
}
