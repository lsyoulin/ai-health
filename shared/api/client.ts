// 知食 API 客户端
// 统一封装请求，供 Web 前端和 Taro 移动端共用

import type {
  AuthResponse,
  User,
  Persona,
  Food,
  FoodRecord,
  KnowledgeCard,
  OptimizationResult,
  SimulationInput,
  SimulationResult,
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
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
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
    const Taro = (await import('@tarojs/taro')).default
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
export const authApi = {
  register: (data: { email: string; password: string; nickname?: string }) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: data }),

  login: (data: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: data }),

  me: () => request<User>('/auth/me'),
}

// ============ Persona API ============
export const personaApi = {
  list: () => request<Persona[]>('/personas'),
  create: (data: Partial<Persona>) =>
    request<Persona>('/personas', { method: 'POST', body: data }),
  update: (id: string, data: Partial<Persona>) =>
    request<Persona>(`/personas/${id}`, { method: 'PATCH', body: data }),
  delete: (id: string) =>
    request<void>(`/personas/${id}`, { method: 'DELETE' }),
}

// ============ 食物 API ============
export const foodApi = {
  list: (params?: { category?: string; search?: string }) => {
    const query = new URLSearchParams()
    if (params?.category) query.set('category', params.category)
    if (params?.search) query.set('search', params.search)
    const q = query.toString()
    return request<Food[]>(`/foods${q ? `?${q}` : ''}`)
  },
  get: (id: string) => request<Food>(`/foods/${id}`),
}

// ============ 饮食记录 API ============
export const recordApi = {
  list: (params?: { personaId?: string; from?: string; to?: string }) => {
    const query = new URLSearchParams()
    if (params?.personaId) query.set('personaId', params.personaId)
    if (params?.from) query.set('from', params.from)
    if (params?.to) query.set('to', params.to)
    const q = query.toString()
    return request<FoodRecord[]>(`/records${q ? `?${q}` : ''}`)
  },
  get: (id: string) => request<FoodRecord>(`/records/${id}`),
  create: (data: any) =>
    request<FoodRecord>('/records', { method: 'POST', body: data }),
  update: (id: string, data: any) =>
    request<FoodRecord>(`/records/${id}`, { method: 'PATCH', body: data }),
  delete: (id: string) =>
    request<void>(`/records/${id}`, { method: 'DELETE' }),
}

// ============ 知识卡 API ============
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
export const optimizeApi = {
  // 分析并优化一餐
  optimize: (data: {
    personaId?: string
    items: Array<{ foodId: string; amountG: number }>
  }) => request<{ result: OptimizationResult; persona: { id: string; name: string; condition: string } }>(
    '/optimize',
    { method: 'POST', body: data }
  ),

  // 决策推演
  simulate: (data: {
    personaId?: string
    items: Array<{ foodId: string; amountG: number }>
    simulation: SimulationInput
  }) => request<SimulationResult>('/optimize/simulate', { method: 'POST', body: data }),
}
