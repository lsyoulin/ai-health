import { useState, useEffect } from 'react'

/**
 * 免责声明横幅组件
 *
 * 用于分析结果页面底部，强制展示医疗免责声明。
 * - 后端模式：接收 disclaimer prop（来自后端 /api/optimize 等响应）
 * - 兜底模式：未传 prop 时显示静态默认文本
 */

interface DisclaimerData {
  text: string
  version: string
  docType: string
}

const DEFAULT_DISCLAIMER: DisclaimerData = {
  text: '本结果基于公开营养学与慢病管理研究，由 AI 模型辅助生成，仅供参考。不能替代医生或营养师的专业建议。如有不适请立即就医或拨打 120。',
  version: 'static',
  docType: 'disclaimer',
}

interface Props {
  /** 后端返回的免责声明数据；不传则使用静态默认 */
  disclaimer?: DisclaimerData
  /** 紧凑模式（用于卡片内） */
  compact?: boolean
}

export default function DisclaimerBanner({ disclaimer, compact = false }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [data, setData] = useState<DisclaimerData>(disclaimer || DEFAULT_DISCLAIMER)

  // 如果传入 disclaimer，使用传入值；否则尝试从 localStorage 读取后端推送的最新版本
  useEffect(() => {
    if (disclaimer) {
      setData(disclaimer)
    } else {
      try {
        const cached = localStorage.getItem('zhishi_disclaimer')
        if (cached) {
          const parsed = JSON.parse(cached)
          if (parsed && parsed.text && parsed.version) {
            setData(parsed)
          }
        }
      } catch {
        // localStorage 不可用或解析失败，使用默认
      }
    }
  }, [disclaimer])

  const preview = compact ? data.text.slice(0, 60) + (data.text.length > 60 ? '...' : '') : data.text

  return (
    <div
      className={`rounded-xl border border-amber-300 bg-amber-50 ${
        compact ? 'p-3' : 'p-4'
      } text-amber-800`}
      role="note"
      aria-label="免责声明"
    >
      <div className="flex items-start gap-2">
        <span className="text-base leading-none mt-0.5" aria-hidden>⚠️</span>
        <div className="flex-1 min-w-0">
          <div className={`text-${compact ? 'xs' : 'sm'} leading-relaxed`}>
            {expanded ? data.text : preview}
          </div>
          {!compact && data.text.length > 60 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-amber-700 underline mt-1 hover:text-amber-900"
            >
              {expanded ? '收起' : '查看完整免责声明'}
            </button>
          )}
          <div className="text-[10px] text-amber-600 mt-1.5 opacity-70">
            版本 v{data.version}
          </div>
        </div>
      </div>
    </div>
  )
}
