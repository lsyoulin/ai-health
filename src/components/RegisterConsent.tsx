import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

/**
 * 注册同意勾选组件
 *
 * 用于注册流程中强制勾选《用户协议》《隐私政策》《健康信息知情同意书》。
 * PIPL 第 29 条要求：处理敏感个人信息需取得个人的单独同意。
 *
 * 用法：
 * <RegisterConsent
 *   onChange={(allChecked) => onChange(allChecked)}
 *   onAgree={(docIds) => onAgree(docIds)}
 * />
 *
 * 待 W9-10 集成阶段嵌入到注册流程时启用。
 */

const API_BASE = 'http://localhost:3001/api'

const REQUIRED_DOCS = [
  { docType: 'user_agreement', label: '《知食用户协议》' },
  { docType: 'privacy_policy', label: '《知食隐私政策》' },
  { docType: 'health_consent', label: '《健康信息知情同意书》' },
] as const

interface Props {
  /** 所有勾选状态变化时回调 */
  onChange?: (allChecked: boolean, checkedDocIds: string[]) => void
  /** 用户点击"同意并继续"时回调，参数为已勾选的 docIds */
  onAgree?: (docIds: string[]) => void
  /** 是否显示"同意并继续"按钮 */
  showAgreeButton?: boolean
}

interface DocInfo {
  id: string
  docType: string
  version: string
  title: string
}

export default function RegisterConsent({
  onChange,
  onAgree,
  showAgreeButton = false,
}: Props) {
  const [docs, setDocs] = useState<DocInfo[]>([])
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_BASE}/legal/docs`)
      .then((res) => res.json())
      .then((data: { docs: DocInfo[] }) => {
        const required = data.docs.filter((d) =>
          REQUIRED_DOCS.some((r) => r.docType === d.docType)
        )
        setDocs(required)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [])

  const toggle = (docId: string) => {
    const next = new Set(checked)
    if (next.has(docId)) {
      next.delete(docId)
    } else {
      next.add(docId)
    }
    setChecked(next)
    if (onChange) {
      onChange(
        REQUIRED_DOCS.every((r) => {
          const doc = docs.find((d) => d.docType === r.docType)
          return doc && next.has(doc.id)
        }),
        Array.from(next)
      )
    }
  }

  const allChecked =
    docs.length > 0 &&
    REQUIRED_DOCS.every((r) => {
      const doc = docs.find((d) => d.docType === r.docType)
      return doc && checked.has(doc.id)
    })

  const handleAgree = () => {
    if (!allChecked) return
    if (onAgree) {
      onAgree(Array.from(checked))
    }
  }

  if (loading) {
    return (
      <div className="text-xs text-moss-500 text-center py-3">
        正在加载合规文档...
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="text-sm font-display font-bold text-moss-700 mb-2">
        请阅读并同意以下协议
      </div>
      {REQUIRED_DOCS.map((required) => {
        const doc = docs.find((d) => d.docType === required.docType)
        const isChecked = doc ? checked.has(doc.id) : false
        return (
          <label
            key={required.docType}
            className="flex items-start gap-2 cursor-pointer group"
          >
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => doc && toggle(doc.id)}
              className="mt-1 w-4 h-4 accent-moss-500"
              disabled={!doc}
            />
            <span className="text-xs text-moss-700 leading-relaxed">
              我已阅读并同意
              <Link
                to={`/legal/${required.docType}`}
                target="_blank"
                className="text-amber-700 underline ml-1"
                onClick={(e) => e.stopPropagation()}
              >
                {required.label}
              </Link>
              {doc && (
                <span className="text-moss-400 ml-1">
                  (v{doc.version})
                </span>
              )}
            </span>
          </label>
        )
      })}
      {!loading && docs.length < REQUIRED_DOCS.length && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2">
          ⚠️ 部分合规文档无法加载，请稍后重试或联系客服
        </div>
      )}
      {showAgreeButton && (
        <button
          onClick={handleAgree}
          disabled={!allChecked}
          className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${
            allChecked
              ? 'bg-moss-700 text-paper hover:bg-moss-600'
              : 'bg-amber-100 text-moss-400 cursor-not-allowed'
          }`}
        >
          同意并继续
        </button>
      )}
    </div>
  )
}
