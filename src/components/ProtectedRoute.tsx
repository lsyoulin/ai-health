import { Navigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import type { ReactNode } from 'react'

/**
 * 知食 · 路由守卫
 *
 * W11-12 新增：
 * - 未登录用户访问受保护路由时跳转到 /auth
 * - 受保护路由：/persona（后端 Persona CRUD）、/records 等
 * - 公开路由（无需登录）：/、/analyze、/simulate、/trends、/parent、/coach、/legal、/auth
 *   — 这些是 Demo 体验核心路径，保持公开让评委快速体验
 */
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = useStore((s) => s.token)

  if (!token) {
    return <Navigate to="/auth" replace />
  }

  return <>{children}</>
}
