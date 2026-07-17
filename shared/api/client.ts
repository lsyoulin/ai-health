// 知食 API 客户端
// 统一封装请求，供 Web 前端和 Taro 移动端共用
//
// W11-12 修复：
// - 所有 API 返回值类型与后端实际响应严格对齐（之前 9 处类型与后端不一致）
// - personaApi.update 方法从 PATCH 改为 PUT（与后端路由一致）
// - optimize/simulate 响应增加 disclaimer 字段

import type {
  AuthResponse,
  User,
  Persona,
  Food,
  FoodRecord,
  KnowledgeCard,
  OptimizationResult,
  SimulationInput,
  LegalDoc,
  LegalDocType,
  LegalAgreementsResponse,
  LegalStatusResponse,
  Disclaimer,
} from '../types'

// 根据环境自动选择 API 基础地址
// H5 开发: http://localhost:3001/api
// 微信小程序: 需要配置合法域名
// 生产: 相对路径 /api
const API_BASE = (() => {
  if (typeof window !== 'undefined' && window.location) {
    // H5 环境
    const host = window.location.hostname
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:3001/api'
    }
    return '/api'
  }
  // 小程序环境 - 需要配置 request 合法域名
  return 'http://localhost:3001/api'
})()

// Token 管理
let authToken: string | null = null

export function setToken(token: string | null) {
  authToken = token
  if (typeof localStorage !== 'undefined') {
    if (token) localStorage.setItem('zhishi_token', token)
    else localStorage.removeItem('zhishi_token')
  }
}

export function getToken(): string | null {
  if (authToken) return authToken
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('zhishi_token')
  }
  return null
}

// 通用请求方法（H5 环境用 fetch，小程序环境用 Taro.request）
async function request<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    body?: any
  } = {}
): Promise<T> {
  const { method = 'GET', body } = options
  const token = getToken()

  // 动态导入 Taro（小程序环境）或使用 fetch（H5 环境）
  let responseData: any
  let responseStatus = 200

  if (typeof fetch !== 'undefined') {
    // H5 环境 - 使用 fetch
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    responseStatus = res.status
    responseData = await res.json()
  } else {
    // 小程序环境 - 使用 Taro.request
    // 注：@tarojs/taro 仅在 mobile 项目中安装，Web 项目通过 try/catch 动态导入避免硬依赖
    let Taro: any
    try {
      // @ts-ignore - @tarojs/taro 仅在 mobile 项目中安装，Web 项目不会进入此分支
      Taro = (await import('@tarojs/taro')).default
    } catch {
      throw new Error('当前环境不支持 Taro.request，请检查是否在 H5 环境')
    }
    const res = await Taro.request({
      url: `${API_BASE}${path}`,
      method,
      header: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      data: body,
    })
    responseStatus = res.statusCode
    responseData = res.data
  }

  if (responseStatus >= 400) {
    throw new Error(responseData.message || responseData.error || '请求失败')
  }

  return responseData as T
}

// ============ 认证 API ============
// 后端实际响应：
//   POST /auth/register → { token, user }
//   POST /auth/login    → { token, user }
//   GET  /auth/me       → { user }
export const authApi = {
  register: (data: { email: string; password: string; nickname?: string }) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: data }),

  login: (data: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: data }),

  me: () => request<{ user: User }>('/auth/me'),
}

// ============ Persona API ============
// 后端实际响应：
//   GET   /personas       → { personas: Persona[] }
//   POST  /personas        → { persona: Persona }
//   PUT   /personas/:id    → { ok: true }
//   DELETE /personas/:id   → { ok: true }
export const personaApi = {
  list: () => request<{ personas: Persona[] }>('/personas'),
  create: (data: Partial<Persona>) =>
    request<{ persona: Persona }>('/personas', { method: 'POST', body: data }),
  update: (id: string, data: Partial<Persona>) =>
    request<{ ok: boolean }>(`/personas/${id}`, { method: 'PUT', body: data }),
  delete: (id: string) =>
    request<{ ok: boolean }>(`/personas/${id}`, { method: 'DELETE' }),
}

// ============ 食物 API ============
// 后端实际响应：
//   GET /foods           → { foods: Food[] }
//   GET /foods/:id       → { food: Food }
export const foodApi = {
  list: (params?: { category?: string; search?: string; limit?: number }) => {
    const query = new URLSearchParams()
    if (params?.category) query.set('category', params.category)
    if (params?.search) query.set('q', params.search)
    if (params?.limit) query.set('limit', String(params.limit))
    const q = query.toString()
    return request<{ foods: Food[] }>(`/foods${q ? `?${q}` : ''}`)
  },
  get: (id: string) => request<{ food: Food }>(`/foods/${id}`),
}

// ============ 饮食记录 API ============
// 后端实际响应：
//   GET    /records        → { records: FoodRecord[] }
//   GET    /records/:id    → { record: FoodRecord }
//   POST   /records        → { record: FoodRecord, disclaimer?: Disclaimer }
//   PATCH  /records/:id    → { ok: true }
//   DELETE /records/:id    → { ok: true }
export const recordApi = {
  list: (params?: { personaId?: string; from?: string; to?: string }) => {
    const query = new URLSearchParams()
    if (params?.personaId) query.set('personaId', params.personaId)
    if (params?.from) query.set('from', params.from)
    if (params?.to) query.set('to', params.to)
    const q = query.toString()
    return request<{ records: FoodRecord[] }>(`/records${q ? `?${q}` : ''}`)
  },
  get: (id: string) => request<{ record: FoodRecord }>(`/records/${id}`),
  create: (data: any) =>
    request<{ record: FoodRecord; disclaimer?: Disclaimer }>('/records', {
      method: 'POST',
      body: data,
    }),
  update: (id: string, data: any) =>
    request<{ ok: boolean }>(`/records/${id}`, { method: 'PATCH', body: data }),
  delete: (id: string) =>
    request<{ ok: boolean }>(`/records/${id}`, { method: 'DELETE' }),
}

// ============ 知识卡 API ============
// 后端实际响应：GET /knowledge → { cards: KnowledgeCard[] }
// 注意：当前后端 knowledge 路由暂未读取，按 cards 返回，类型待补
export const knowledgeApi = {
  list: (params?: { category?: string; type?: string }) => {
    const query = new URLSearchParams()
    if (params?.category) query.set('category', params.category)
    if (params?.type) query.set('type', params.type)
    const q = query.toString()
    return request<KnowledgeCard[]>(`/knowledge${q ? `?${q}` : ''}`)
  },
}

// ============ 组合优化器 API ============
// 后端实际响应：
//   POST /optimize         → { result, persona, disclaimer }
//   POST /optimize/simulate → { baseline, adjusted, improvement, persona, disclaimer }
export interface OptimizeResponse {
  result: OptimizationResult
  persona: { id: string; name: string; condition: string }
  disclaimer?: Disclaimer
}

export interface SimulateApiResult {
  baseline: {
    predictedGlucose: number
    glucoseDelta: number
    riskLevel: 'safe' | 'warning' | 'danger'
  }
  adjusted: {
    predictedGlucose: number
    glucoseDelta: number
    exerciseDelta: number
    totalNutrition: {
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
  }
  improvement: number
  persona: { id: string; name: string; condition: string }
  disclaimer?: Disclaimer
}

export const optimizeApi = {
  // 分析并优化一餐
  optimize: (data: {
    personaId?: string
    items: Array<{ foodId: string; amountG: number }>
  }) => request<OptimizeResponse>('/optimize', { method: 'POST', body: data }),

  // 决策推演
  simulate: (data: {
    personaId?: string
    items: Array<{ foodId: string; amountG: number }>
    simulation: SimulationInput
  }) =>
    request<SimulateApiResult>('/optimize/simulate', {
      method: 'POST',
      body: data,
    }),
}

// ============ 合规文档 API ============
export const legalApi = {
  // 列出所有当前生效的合规文档
  listDocs: () =>
    request<{ docs: LegalDoc[] }>('/legal/docs'),

  // 获取指定类型的当前生效版本
  getDoc: (docType: LegalDocType) =>
    request<{ doc: LegalDoc }>(`/legal/docs/${docType}`),

  // 用户同意（批量记录）
  agree: (data: {
    docIds: string[]
    source?: 'register' | 'settings' | 'upgrade'
  }) =>
    request<{
      agreed: boolean
      count: number
      docs: Array<{ id: string; docType: string; version: string }>
      agreedAt: string
    }>('/legal/agree', { method: 'POST', body: data }),

  // 查询当前用户的同意历史（合规审计用）
  getAgreements: () =>
    request<LegalAgreementsResponse>('/legal/agreements'),

  // 检查用户是否已同意所有必需文档
  getStatus: () =>
    request<LegalStatusResponse>('/legal/status'),
}
