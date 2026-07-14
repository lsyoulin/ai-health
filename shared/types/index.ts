// 知食共享类型定义
// 供 Web 前端和 Taro 移动端共用

// ============ 用户 ============
export interface User {
  id: string
  email: string
  nickname?: string
  birthYear?: number
  gender?: 'male' | 'female' | 'other'
  createdAt: string
}

export interface AuthResponse {
  token: string
  user: User
}

// ============ 慢病 Persona ============
export type Condition = 'diabetes' | 'hypertension' | 'diabetes_hypertension' | 'healthy'
export type Relation = 'self' | 'parent' | 'spouse' | 'other'

export interface Persona {
  id: string
  userId: string
  name: string
  relation: Relation
  condition: Condition
  stage?: string
  bloodGlucoseTarget?: { fasting: number; postprandial: number }
  bloodPressureTarget?: { systolic: number; diastolic: number }
  medications: string[]
  createdAt: string
  updatedAt: string
}

// ============ 食物 ============
export type FoodCategory = '主食' | '蔬菜' | '肉类' | '水果' | '蛋类' | '奶类' | '豆类' | '坚果' | '调味' | '其他'

export interface Food {
  id: string
  name: string
  category: FoodCategory
  subcategory?: string
  energyKcal: number
  carbsG: number
  proteinG: number
  fatG: number
  fiberG?: number
  sodiumMg?: number
  potassiumMg?: number
  gi?: number
  gl?: number
  defaultPortionG: number
  source?: string
}

// ============ 饮食记录 ============
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface FoodRecordItem {
  id?: string
  foodId: string
  food?: Food
  amountG: number
  order: number
}

export interface FoodRecord {
  id: string
  userId: string
  personaId?: string
  persona?: Persona
  mealType: MealType
  mealTime: string
  predictedGlucose?: number
  predictedGlucoseRange?: { min: number; max: number }
  actualGlucose?: number
  optimization?: any
  notes?: string
  items: FoodRecordItem[]
  createdAt: string
}

// ============ 知识卡 ============
export type KnowledgeCategory = 'diabetes' | 'hypertension' | 'general'
export type KnowledgeType = 'mechanism' | 'food' | 'complication' | 'emergency' | 'daily'

export interface KnowledgeCard {
  id: string
  title: string
  category: KnowledgeCategory
  type: KnowledgeType
  content: string
  sourceRef?: string
  durationSec: number
}

// ============ 健康预测 ============
export interface HealthPrediction {
  predictedGlucose: number
  predictedGlucoseRange: { min: number; max: number }
  riskLevel: 'safe' | 'warning' | 'danger'
  advice: string
  carbsTotal: number
  energyTotal: number
  sodiumTotal?: number
}

// ============ 组合优化器 ============
export interface MealNutrition {
  calories: number
  carbs: number
  protein: number
  fat: number
  fiber: number
  sodium: number
  potassium: number
  weightedGI: number
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
  impact: { glucoseDelta: number; bpDelta: number }
  priority: 'high' | 'medium' | 'low'
}

export interface OptimizationResult {
  prediction: MealPrediction
  optimization: {
    score: number
    adjustments: OptimizationAdjustment[]
    optimizedPrediction: MealPrediction
  }
  suggestions: string[]
}

export interface SimulationInput {
  carbReduction?: number
  addVegetable?: boolean
  exercise?: number
  replaceStaple?: boolean
  changeOrder?: boolean
}

export interface SimulationResult {
  baseline: {
    predictedGlucose: number
    glucoseDelta: number
    riskLevel: string
  }
  adjusted: {
    predictedGlucose: number
    glucoseDelta: number
    exerciseDelta: number
    totalNutrition: MealNutrition
  }
  improvement: number
  persona: { id: string; name: string; condition: string }
}

// ============ 合规文档 ============
export type LegalDocType = 'user_agreement' | 'privacy_policy' | 'health_consent' | 'disclaimer'

export interface LegalDoc {
  id: string
  docType: LegalDocType
  version: string
  title: string
  content: string
  effectiveDate: string
}

export interface Disclaimer {
  text: string
  version: string
  docType: string
}

export interface UserAgreementRecord {
  id: string
  docType: LegalDocType
  version: string
  agreeSource: 'register' | 'settings' | 'upgrade'
  ipAddress?: string | null
  createdAt: string
  doc: {
    id: string
    title: string
    effectiveDate: string
  }
}

export interface LegalAgreementsResponse {
  agreements: UserAgreementRecord[]
  latest: UserAgreementRecord[]
  requiredDocs: LegalDocType[]
  agreedDocTypes: string[]
  allRequiredAgreed: boolean
}

export interface LegalStatusResponse {
  allAgreed: boolean
  details: Array<{
    docType: LegalDocType
    agreed: boolean
    version: string | null
  }>
}
