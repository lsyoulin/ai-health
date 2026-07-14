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
