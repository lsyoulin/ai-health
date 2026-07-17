import { View, Text } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { legalApi } from '@shared/api/client'
import type { LegalDoc, LegalDocType } from '@shared/types'
import './index.scss'

// 合规文档标题映射（兜底，后端 doc.title 优先）
const DOC_TITLE_FALLBACK: Record<string, string> = {
  user_agreement: '用户协议',
  privacy_policy: '隐私政策',
  disclaimer: '免责声明',
  health_consent: '健康知情同意书',
}

// 简化 markdown 行类型
type LineType = 'h2' | 'h3' | 'li' | 'p'
interface ParsedLine {
  type: LineType
  text: string
}

// 简化 markdown 渲染：## 标题、### 小标题、- 列表项、其他为段落
function parseMarkdown(content: string): ParsedLine[] {
  if (!content) return []
  return content.split('\n').map(line => {
    const trimmed = line.trim()
    if (trimmed.startsWith('## ')) {
      return { type: 'h2' as LineType, text: trimmed.slice(3).trim() }
    }
    if (trimmed.startsWith('### ')) {
      return { type: 'h3' as LineType, text: trimmed.slice(4).trim() }
    }
    if (trimmed.startsWith('- ')) {
      return { type: 'li' as LineType, text: trimmed.slice(2).trim() }
    }
    return { type: 'p' as LineType, text: trimmed }
  }).filter(l => l.text.length > 0)
}

export default function Legal() {
  const router = useRouter()
  const [doc, setDoc] = useState<LegalDoc | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string>('')

  const docType = (router.params?.docType || 'disclaimer') as LegalDocType

  useEffect(() => {
    loadDoc(docType)
  }, [docType])

  const loadDoc = async (type: LegalDocType) => {
    setLoading(true)
    setErrorMsg('')
    try {
      console.log('[legal] 加载合规文档', type)
      const res = await legalApi.getDoc(type)
      setDoc(res.doc)
    } catch (e: any) {
      console.error('[legal] 加载合规文档失败', e)
      setErrorMsg(e.message || '文档加载失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const goBack = () => {
    Taro.navigateBack().catch(() => {
      // 无历史页可返回时，回首页
      Taro.switchTab({ url: '/pages/profile/index' })
    })
  }

  const title = doc?.title || DOC_TITLE_FALLBACK[docType] || '合规文档'
  const lines = doc ? parseMarkdown(doc.content) : []

  return (
    <View className='page-legal'>
      {/* 顶部导航条 */}
      <View className='legal-header'>
        <Text className='back-btn' onClick={goBack}>‹</Text>
        <Text className='header-title'>{title}</Text>
      </View>

      {loading && (
        <View className='legal-body'>
          <Text className='loading-text'>加载中...</Text>
        </View>
      )}

      {!loading && errorMsg && (
        <View className='legal-body'>
          <Text className='error-text'>{errorMsg}</Text>
        </View>
      )}

      {!loading && doc && (
        <View className='legal-body'>
          {/* 文档元信息 */}
          <View className='doc-meta'>
            <Text className='doc-title'>{doc.title}</Text>
            <View className='meta-row'>
              <Text className='meta-label'>版本</Text>
              <Text className='meta-value'>v{doc.version}</Text>
            </View>
            <View className='meta-row'>
              <Text className='meta-label'>生效日期</Text>
              <Text className='meta-value'>{doc.effectiveDate}</Text>
            </View>
          </View>

          {/* 正文（简化 markdown 渲染） */}
          <View className='doc-content'>
            {lines.map((line, idx) => {
              if (line.type === 'h2') {
                return <Text key={idx} className='md-h2'>{line.text}</Text>
              }
              if (line.type === 'h3') {
                return <Text key={idx} className='md-h3'>{line.text}</Text>
              }
              if (line.type === 'li') {
                return (
                  <View key={idx} className='md-li'>
                    <Text className='li-bullet'>·</Text>
                    <Text className='li-text'>{line.text}</Text>
                  </View>
                )
              }
              return <Text key={idx} className='md-p'>{line.text}</Text>
            })}
          </View>
        </View>
      )}
    </View>
  )
}
