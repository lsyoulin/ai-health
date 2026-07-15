import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import RegisterConsent from '../components/RegisterConsent'
import Logo from '../components/Logo'

const API_BASE = 'http://localhost:3001/api'

/**
 * 知食 · 登录/注册页
 *
 * W9-10 新增：
 * - 登录模式：邮箱 + 密码
 * - 注册模式：邮箱 + 密码 + 必须勾选 3 份合规文档（PIPL 第 29 条要求敏感信息单独同意）
 * - 注册成功后自动调用 /legal/agree 记录用户同意
 * - 提供 demo 账号快捷登录（demo@zhishi.com / demo123456）
 */
export default function Auth() {
  const navigate = useNavigate()
  const { setAuth } = useStore()

  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [consentChecked, setConsentChecked] = useState(false)
  const [consentDocIds, setConsentDocIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (mode === 'register') {
        if (!consentChecked) {
          setError('请先阅读并同意所有协议')
          setLoading(false)
          return
        }

        // 1. 注册
        const regRes = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, nickname: nickname || undefined }),
        })
        const regData = await regRes.json()
        if (!regRes.ok) {
          throw new Error(regData.error || '注册失败')
        }

        // 2. 记录合规同意
        if (consentDocIds.length > 0) {
          await fetch(`${API_BASE}/legal/agree`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${regData.token}`,
            },
            body: JSON.stringify({ docIds: consentDocIds, source: 'register' }),
          }).catch((err) => {
            console.warn('合规同意记录失败（不阻塞注册流程）:', err)
          })
        }

        setAuth(regData.token, regData.user)
      } else {
        // 登录
        const loginRes = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        const loginData = await loginRes.json()
        if (!loginRes.ok) {
          throw new Error(loginData.error || '登录失败')
        }
        setAuth(loginData.token, loginData.user)
      }

      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'demo@zhishi.com', password: 'demo123456' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '登录失败')
      setAuth(data.token, data.user)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-paper bg-grain">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Logo size={40} />
            <div className="flex flex-col">
              <span className="font-display font-bold text-2xl text-moss-700 leading-none">
                知食
              </span>
              <span className="text-[10px] tracking-widest text-amber-700 mt-0.5">
                ZHISHI · AI
              </span>
            </div>
          </div>
          <p className="text-xs text-moss-500">「吃」掉慢病，让每一口都被懂</p>
        </div>

        {/* 表单卡片 */}
        <div className="rounded-2xl bg-paper border border-amber-200 p-6 md:p-8 shadow-sm">
          {/* 模式切换 */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-moss-700 text-paper'
                  : 'bg-amber-100 text-moss-700 hover:bg-amber-200'
              }`}
            >
              登录
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-moss-700 text-paper'
                  : 'bg-amber-100 text-moss-700 hover:bg-amber-200'
              }`}
            >
              注册
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 邮箱 */}
            <div>
              <label className="block text-xs text-moss-700 mb-1">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-3 py-2 text-sm rounded-lg border border-amber-200 bg-paper text-moss-700 focus:outline-none focus:border-moss-500"
              />
            </div>

            {/* 密码 */}
            <div>
              <label className="block text-xs text-moss-700 mb-1">
                密码 {mode === 'register' && <span className="text-moss-400">（至少 8 位）</span>}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={mode === 'register' ? 8 : 1}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-sm rounded-lg border border-amber-200 bg-paper text-moss-700 focus:outline-none focus:border-moss-500"
              />
            </div>

            {/* 昵称（注册时可选） */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs text-moss-700 mb-1">
                  昵称 <span className="text-moss-400">（可选）</span>
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  maxLength={32}
                  placeholder="如：紫苏"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-amber-200 bg-paper text-moss-700 focus:outline-none focus:border-moss-500"
                />
              </div>
            )}

            {/* 合规同意（注册时必填） */}
            {mode === 'register' && (
              <div className="pt-2 border-t border-amber-100">
                <RegisterConsent
                  onChange={(allChecked, docIds) => {
                    setConsentChecked(allChecked)
                    setConsentDocIds(docIds)
                  }}
                />
              </div>
            )}

            {/* 错误提示 */}
            {error && (
              <div className="text-xs text-signal-danger bg-red-50 border border-red-200 rounded-md p-2">
                {error}
              </div>
            )}

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={loading || (mode === 'register' && !consentChecked)}
              className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${
                loading || (mode === 'register' && !consentChecked)
                  ? 'bg-amber-100 text-moss-400 cursor-not-allowed'
                  : 'bg-moss-700 text-paper hover:bg-moss-600'
              }`}
            >
              {loading ? '处理中...' : mode === 'login' ? '登录' : '注册并同意'}
            </button>
          </form>

          {/* Demo 登录快捷入口 */}
          {mode === 'login' && (
            <div className="mt-4 pt-4 border-t border-amber-100">
              <button
                onClick={handleDemoLogin}
                disabled={loading}
                className="w-full py-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-all"
              >
                🔍 使用 demo 账号快捷登录
                <span className="block text-[10px] text-moss-400 mt-0.5">
                  demo@zhishi.com / demo123456
                </span>
              </button>
            </div>
          )}
        </div>

        {/* 底部链接 */}
        <div className="mt-6 text-center">
          <Link to="/" className="text-xs text-amber-700">← 返回首页</Link>
          <span className="mx-2 text-moss-300">·</span>
          <Link to="/legal/user_agreement" className="text-xs text-amber-700">用户协议</Link>
          <span className="mx-1 text-moss-300">·</span>
          <Link to="/legal/privacy_policy" className="text-xs text-amber-700">隐私政策</Link>
        </div>
      </div>
    </div>
  )
}
