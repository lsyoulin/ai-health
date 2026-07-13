import type { Food, Persona, AnalysisResult, ChronicType } from '../store/useStore'
import { getRiskLevel } from '../store/useStore'

/**
 * 知食 · 健康预测引擎
 *
 * 核心算法：
 * - 预测餐后血糖增量 = (碳水g × GI值 / 100 × Profile血糖敏感度) / 10
 * - 预测餐后血压变化 = (钠摄入mg / 1000 × Profile钠敏感度) × 2
 *
 * 这是基于营养学与慢病病理学的简化模型，用于Demo演示。
 * 实际医疗决策应咨询专业医师。
 */

// 血糖预测：基于碳水+GI+敏感度
export function predictGlucose(food: Food, persona: Persona): number {
  const { carbs, gi } = food.nutrition
  const baseIncrease = (carbs * (gi / 100) * persona.glucoseSensitivity) / 10

  // 基线：空腹血糖 + 平均餐后增量
  const basePostprandial = persona.fastingGlucose + (persona.postprandialGlucose - persona.fastingGlucose)

  // 个性化预测
  const predicted = basePostprandial * 0.4 + (persona.fastingGlucose + baseIncrease) * 0.6

  // 健康人有自我调节能力，血糖上限不超过7.8
  if (persona.type === 'healthy') {
    return Math.min(predicted, 7.8)
  }

  return Math.round(predicted * 10) / 10
}

// 血糖增量
export function getGlucoseDelta(food: Food, persona: Persona): number {
  const predicted = predictGlucose(food, persona)
  return Math.round((predicted - persona.fastingGlucose) * 10) / 10
}

// 血压预测：基于钠摄入
export function predictBpChange(food: Food, persona: Persona): number {
  const { sodium } = food.nutrition
  // 每摄入1000mg钠，敏感人群血压上升约 2-4 mmHg
  const change = (sodium / 1000) * persona.sodiumSensitivity * 2.2
  return Math.round(change * 10) / 10
}

// 综合分析结果
export function analyzeFood(food: Food, persona: Persona): AnalysisResult {
  const predictedGlucose = predictGlucose(food, persona)
  const glucoseDelta = getGlucoseDelta(food, persona)
  const predictedBpChange = predictBpChange(food, persona)
  const riskLevel = getRiskLevel(predictedGlucose)

  const suggestions = generateSuggestions(food, persona, predictedGlucose, glucoseDelta, predictedBpChange, riskLevel)

  return {
    foodId: food.id,
    personaId: persona.id,
    predictedGlucose,
    glucoseDelta,
    predictedBpChange,
    riskLevel,
    suggestion: suggestions[0] || '',
    suggestions,
  }
}

// 生成个性化AI建议
function generateSuggestions(
  food: Food,
  persona: Persona,
  glucose: number,
  glucoseDelta: number,
  bpChange: number,
  risk: 'safe' | 'warning' | 'danger'
): string[] {
  const suggestions: string[] = []
  const { carbs, sodium, gi, calories } = food.nutrition
  const personaName = getPersonaLabel(persona.type)
  const isHighGi = gi >= 70
  const isHighSodium = sodium >= 1000
  const isHighCarb = carbs >= 60

  // 主建议：基于风险等级
  if (risk === 'danger') {
    suggestions.push(
      `对您(${personaName})而言，这顿${food.name}预计让餐后血糖升至 ${glucose} mmol/L（↑${glucoseDelta}），属于超标范围。` +
      (isHighCarb ? `碳水${carbs}g负担较重，建议立即减少主食分量1/3。` : '建议减少本次进食分量。')
    )
  } else if (risk === 'warning') {
    suggestions.push(
      `对您(${personaName})而言，这顿${food.name}预计让餐后血糖升至 ${glucose} mmol/L（↑${glucoseDelta}），处于临界值。` +
      (isHighGi ? `食物GI值${gi}偏高，建议搭配膳食纤维以延缓血糖上升。` : '可适量进食，注意餐后监测。')
    )
  } else {
    suggestions.push(
      `对您(${personaName})而言，这顿${food.name}预计让餐后血糖升至 ${glucose} mmol/L（↑${glucoseDelta}），处于安全范围。` +
      '继续保持当前的饮食结构。'
    )
  }

  // 钠/血压建议
  if (isHighSodium && (persona.type === 'hypertension' || persona.type === 'diabetes_hypertension')) {
    suggestions.push(
      `${food.name}含钠${sodium}mg较高，对您的高血压而言预计让血压上升约${bpChange} mmHg。` +
      (food.id === 'beef_noodle' || food.id === 'mala_xiangguo' ? '建议不要喝汤/汤底。' : '建议下一餐清淡饮食以平衡。')
    )
  }

  // 高GI食物建议
  if (isHighGi && persona.type !== 'healthy') {
    suggestions.push(
      `本餐GI值${gi}较高（≥70为高GI），血糖反应快。建议更换为低GI主食（如糙米、燕麦、杂粮），可降低血糖反应约30-40%。`
    )
  }

  // 热量建议
  if (calories >= 700 && persona.bmi >= 25) {
    suggestions.push(
      `本餐热量${calories}kcal偏高，您的BMI${persona.bmi}。建议分餐或增加餐后散步20-30分钟以辅助血糖控制。`
    )
  }

  // 健康人建议
  if (persona.type === 'healthy') {
    if (suggestions.length === 1) {
      suggestions.push('对健康人群而言，本餐影响可控。建议保持均衡饮食与规律运动。')
    }
  }

  return suggestions
}

function getPersonaLabel(type: ChronicType): string {
  switch (type) {
    case 'diabetes': return '2型糖尿病'
    case 'hypertension': return '高血压'
    case 'diabetes_hypertension': return '糖尿病+高血压'
    case 'healthy': return '健康人'
  }
}

// 决策推演：调整分量后的预测
export function simulateAdjustment(
  food: Food,
  persona: Persona,
  adjustment: {
    carbReduction?: number // 0-1 减少碳水比例
    addVegetable?: boolean // 增加蔬菜
    exercise?: number // 餐后运动分钟数
  }
): { predictedGlucose: number; delta: number; exerciseDelta: number } {
  const adjustedFood: Food = {
    ...food,
    nutrition: {
      ...food.nutrition,
      carbs: food.nutrition.carbs * (1 - (adjustment.carbReduction || 0)),
      // 增加蔬菜会降低整体GI值
      gi: adjustment.addVegetable ? Math.max(40, food.nutrition.gi * 0.7) : food.nutrition.gi,
    },
  }

  const predictedGlucose = predictGlucose(adjustedFood, persona)
  const baseline = predictGlucose(food, persona)

  // 运动降血糖：每20分钟运动降低约1.0-1.5 mmol/L
  const exerciseDelta = (adjustment.exercise || 0) / 20 * 1.2

  const finalGlucose = Math.max(persona.fastingGlucose, predictedGlucose - exerciseDelta)

  return {
    predictedGlucose: Math.round(finalGlucose * 10) / 10,
    delta: Math.round((finalGlucose - baseline) * 10) / 10,
    exerciseDelta: Math.round(exerciseDelta * 10) / 10,
  }
}
