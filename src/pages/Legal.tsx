import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'

/**
 * 合规文档展示页
 *
 * 路由：/legal/:docType
 * - /legal/user_agreement  → 用户协议
 * - /legal/privacy_policy   → 隐私政策
 * - /legal/health_consent   → 健康信息知情同意书
 * - /legal/disclaimer       → 免责声明
 *
 * 数据来源：后端 GET /api/legal/docs/:docType
 * 后端不可用时降级为本地静态摘要。
 */

const API_BASE = 'http://localhost:3001/api'

const DOC_META: Record<string, { title: string; fallback: string }> = {
  user_agreement: {
    title: '用户协议',
    fallback: '《知食用户协议》当前无法从服务器加载，请稍后重试或联系 support@zhishi.com。',
  },
  privacy_policy: {
    title: '隐私政策',
    fallback: '《知食隐私政策》当前无法从服务器加载，请稍后重试或联系 support@zhishi.com。',
  },
  health_consent: {
    title: '健康信息知情同意书',
    fallback: '《健康信息知情同意书》当前无法从服务器加载，请稍后重试或联系 support@zhishi.com。',
  },
  disclaimer: {
    title: '分析结果免责声明',
    fallback: '本结果基于公开营养学与慢病管理研究，由 AI 模型辅助生成，仅供参考。不能替代医生或营养师的专业建议。如有不适请立即就医或拨打 120。',
  },
}

interface LegalDocData {
  id: string
  docType: string
  version: string
  title: string
  content: string
  effectiveDate: string
}

export default function Legal() {
  const { docType = 'user_agreement' } = useParams<{ docType: string }>()
  const [doc, setDoc] = useState<LegalDocData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const meta = DOC_META[docType] || DOC_META.user_agreement

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetch(`${API_BASE}/legal/docs/${docType}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data: { doc: LegalDocData }) => {
        if (!cancelled) {
          setDoc(data.doc)
          setLoading(false)
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message)
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [docType])

  // 简易 markdown 渲染（## 标题 + 段落）
  const renderMarkdown = (md: string) => {
    return md.split('\n').map((line, idx) => {
      if (line.startsWith('## ')) {
        return (
          <h2 key={idx} className="font-display text-xl font-bold text-moss-700 mt-6 mb-3 first:mt-0">
            {line.replace(/^## /, '')}
          </h2>
        )
      }
      if (line.startsWith('### ')) {
        return (
          <h3 key={idx} className="font-display text-lg font-semibold text-moss-700 mt-5 mb-2">
            {line.replace(/^### /, '')}
          </h3>
        )
      }
      if (line.startsWith('- ')) {
        return (
          <div key={idx} className="text-sm text-moss-700 leading-relaxed pl-4 my-1">
            · {line.replace(/^- /, '')}
          </div>
        )
      }
      if (line.trim() === '') {
        return <div key={idx} className="h-3" />
      }
      return (
        <p key={idx} className="text-sm text-moss-700 leading-relaxed my-2">
          {line}
        </p>
      )
    })
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <Link to="/" className="text-xs text-amber-700">← 返回首页</Link>

      <header className="mt-3 mb-6">
        <h1 className="font-display text-3xl font-bold text-moss-700">{meta.title}</h1>
        {doc && (
          <div className="text-xs text-moss-500 mt-2 flex items-center gap-3">
            <span>版本 v{doc.version}</span>
            <span>·</span>
            <span>生效日期：{new Date(doc.effectiveDate).toLocaleDateString('zh-CN')}</span>
          </div>
        )}
      </header>

      {/* 文档切换 Tab */}
      <nav className="flex flex-wrap gap-2 mb-6 border-b border-amber-200 pb-3">
        {Object.entries(DOC_META).map(([type, m]) => (
          <Link
            key={type}
            to={`/legal/${type}`}
            className={`px-3 py-1.5 text-xs rounded-md transition-all ${
              docType === type
                ? 'bg-moss-700 text-paper'
                : 'text-moss-700 hover:bg-amber-100'
            }`}
          >
            {m.title}
          </Link>
        ))}
      </nav>

      {/* 文档内容 */}
      <article className="rounded-2xl bg-paper border border-amber-200 p-6 md:p-8">
        {loading ? (
          <div className="text-center py-12 text-moss-500 text-sm">
            正在加载文档...
          </div>
        ) : error ? (
          <div className="space-y-3">
            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">
              无法连接服务器：{error}。已显示摘要版本：
            </div>
            <p className="text-sm text-moss-700 leading-relaxed">{meta.fallback}</p>
          </div>
        ) : doc ? (
          <div className="space-y-1">{renderMarkdown(doc.content)}</div>
        ) : (
          <p className="text-sm text-moss-500">{meta.fallback}</p>
        )}
      </article>

      {/* 健康咨询提示 */}
      <div className="mt-6 rounded-xl bg-moss-700 text-paper p-4 flex items-center justify-between">
        <div className="text-sm">
          <div className="font-display font-bold mb-1">有健康问题需要咨询？</div>
          <div className="text-xs opacity-80">本服务不替代医生诊断，请咨询专业医生</div>
        </div>
        <a
          href="tel:120"
          className="px-3 py-2 bg-paper text-moss-700 rounded-md text-xs font-bold hover:bg-amber-100"
        >
          紧急就医 120
        </a>
      </div>
    </div>
  )
}
