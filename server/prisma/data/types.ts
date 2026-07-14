// ============ Seed 数据共享类型 ============
// 与 prisma/schema.prisma 的 Food 模型对齐

export interface FoodSeed {
  name: string
  category: string // 主食 | 蔬菜 | 肉类 | 水果 | 蛋类 | 奶类 | 豆类 | 坚果 | 调味 | 其他
  subcategory?: string
  energyKcal: number
  carbsG: number
  proteinG: number
  fatG: number
  fiberG?: number
  sodiumMg?: number
  potassiumMg?: number
  gi?: number // glycemic index 0-100
  gl?: number // glycemic load
  defaultPortionG?: number
  source?: string
}

export interface PersonaSeed {
  name: string
  relation: string // self | parent | spouse | other
  condition: string // diabetes | hypertension | diabetes_hypertension | healthy
  stage?: string
  bloodGlucoseTarget?: { fasting: number; postprandial: number }
  bloodPressureTarget?: { systolic: number; diastolic: number }
  medications: string[]
}

export interface KnowledgeCardSeed {
  title: string
  category: string // diabetes | hypertension | general
  type: string // mechanism | food | complication | emergency | daily
  content: string // markdown
  sourceRef?: string
  durationSec?: number
}
