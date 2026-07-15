import { ReactNode } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ===== 类型定义 =====
export type ChronicType = 'diabetes' | 'hypertension' | 'diabetes_hypertension' | 'healthy'

export interface Persona {
  id: string
  name: string
  type: ChronicType
  age: number
  gender: 'male' | 'female'
  fastingGlucose: number // mmol/L
  postprandialGlucose: number // mmol/L
  bloodPressureHigh: number // mmHg
  bloodPressureLow: number // mmHg
  medication: string
  bmi: number
  dietPreference: string
  // 健康预测系数（用于个性化计算）
  glucoseSensitivity: number // 血糖敏感度系数 0.5-2.0
  sodiumSensitivity: number  // 钠敏感度系数 0.5-2.0
}

export interface Nutrition {
  calories: number // kcal
  carbs: number    // g
  protein: number  // g
  fat: number      // g
  sodium: number   // mg
  gi: number       // 血糖生成指数 0-100
}

export interface Food {
  id: string
  name: string
  emoji: string
  category: 'staple' | 'meat' | 'vegetable' | 'soup' | 'snack' | 'mixed'
  description: string
  imageColor: string // 用于卡片背景渐变
  nutrition: Nutrition
}

export interface AnalysisResult {
  foodId: string
  personaId: string
  predictedGlucose: number     // 预测餐后2h血糖 mmol/L
  glucoseDelta: number         // 血糖增量
  predictedBpChange: number    // 预测血压变化 mmHg
  riskLevel: 'safe' | 'warning' | 'danger'
  suggestion: string           // AI建议
  suggestions: string[]        // 多条建议
}

// 后端用户信息
interface BackendUser {
  id: string
  email: string
  nickname?: string
}

interface AppState {
  // 认证状态（W9-10 新增）
  token: string | null
  user: BackendUser | null
  setAuth: (token: string, user: BackendUser) => void
  logout: () => void

  // 当前选中的Persona
  currentPersonaId: string
  setCurrentPersona: (id: string) => void

  // 当前选中的食物（用于分析）
  currentFoodId: string | null
  setCurrentFood: (id: string) => void

  // 父母模式
  parentMode: boolean
  setParentMode: (on: boolean) => void
  parentPersonaId: string | null
  setParentPersona: (id: string) => void

  // 历史记录（最近分析）
  history: Array<{ foodId: string; personaId: string; timestamp: number }>
  addHistory: (foodId: string, personaId: string) => void
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // 认证（W9-10 新增）
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),

      currentPersonaId: 'diabetes_t2',
      setCurrentPersona: (id) => set({ currentPersonaId: id }),

      currentFoodId: null,
      setCurrentFood: (id) => set({ currentFoodId: id }),

      parentMode: false,
      setParentMode: (on) => set({ parentMode: on }),
      parentPersonaId: null,
      setParentPersona: (id) => set({ parentPersonaId: id }),

      history: [],
      addHistory: (foodId, personaId) =>
        set((state) => ({
          history: [
            ...state.history.slice(-19), // 保留最近20条
            { foodId, personaId, timestamp: Date.now() },
          ],
        })),
    }),
    {
      name: 'zhishi-storage',
    }
  )
)

// ===== 默认值导出（方便组件使用） =====
export const DefaultPersona: Persona = {
  id: 'demo',
  name: '演示用户',
  type: 'diabetes_hypertension',
  age: 58,
  gender: 'male',
  fastingGlucose: 7.2,
  postprandialGlucose: 9.8,
  bloodPressureHigh: 135,
  bloodPressureLow: 85,
  medication: '二甲双胍 500mg bid',
  bmi: 26.0,
  dietPreference: '北方口味，偏咸',
  glucoseSensitivity: 1.3,
  sodiumSensitivity: 1.2,
}

// ===== 工具函数 =====
export function getRiskLevel(glucose: number): 'safe' | 'warning' | 'danger' {
  if (glucose < 8.0) return 'safe'
  if (glucose < 11.1) return 'warning'
  return 'danger'
}

export function getRiskColor(level: 'safe' | 'warning' | 'danger'): string {
  switch (level) {
    case 'safe': return 'text-signal-safe'
    case 'warning': return 'text-signal-warning'
    case 'danger': return 'text-signal-danger'
  }
}

export function getRiskBgColor(level: 'safe' | 'warning' | 'danger'): string {
  switch (level) {
    case 'safe': return 'bg-signal-safe'
    case 'warning': return 'bg-signal-warning'
    case 'danger': return 'bg-signal-danger'
  }
}

export function getRiskLabel(level: 'safe' | 'warning' | 'danger'): string {
  switch (level) {
    case 'safe': return '安全'
    case 'warning': return '临界'
    case 'danger': return '超标'
  }
}

// 用于 children prop 的类型
export type { ReactNode }
