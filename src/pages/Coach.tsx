import { useState, useRef, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { getFoodById, getPersonaById, FOODS } from '../data/foods'
import { analyzeFood } from '../lib/healthEngine'
import PersonaBadge from '../components/PersonaBadge'
import { Link } from 'react-router-dom'

interface Message {
  role: 'user' | 'ai'
  content: string
  timestamp: number
}

/**
 * 知食 · AI 对话教练
 *
 * 基于慢病 Profile 的预置对话脚本引擎
 */
export default function Coach() {
  const { currentPersonaId, currentFoodId } = useStore()
  const persona = getPersonaById(currentPersonaId)!
  const food = getFoodById(currentFoodId || 'beef_noodle')!
  const result = analyzeFood(food, persona)

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      content: `您好，我是知食AI饮食教练。当前身份：${persona.name}。您可以问我关于${food.name}的健康影响，或试试下方的快捷问题。`,
      timestamp: Date.now(),
    },
  ])
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = (text: string) => {
    if (!text.trim()) return

    const userMsg: Message = { role: 'user', content: text, timestamp: Date.now() }
    setMessages((m) => [...m, userMsg])

    // AI 回复（基于关键词的脚本引擎）
    setTimeout(() => {
      const aiReply = generateAiReply(text, food, persona, result)
      setMessages((m) => [...m, { role: 'ai', content: aiReply, timestamp: Date.now() }])
    }, 600)

    setInput('')
  }

  const quickQuestions = [
    `${food.name}我能吃多少？`,
    '怎么调整能降低血糖？',
    '餐后应该做什么运动？',
    '钠含量对我血压影响？',
  ]

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 h-[calc(100vh-180px)] flex flex-col">
      <header className="mb-4">
        <Link to="/" className="text-xs text-amber-700">← 返回首页</Link>
        <div className="flex items-center justify-between mt-2">
          <h1 className="font-display text-2xl font-bold text-moss-700">
            AI 饮食教练
          </h1>
          <PersonaBadge type={persona.type} size="sm" />
        </div>
        <p className="text-xs text-moss-500 mt-1">
          当前话题：{food.emoji} {food.name}
        </p>
      </header>

      {/* 消息区 */}
      <div className="flex-1 overflow-y-auto rounded-2xl bg-paper border border-amber-200 p-4 mb-4 space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                m.role === 'user'
                  ? 'bg-moss-700 text-paper'
                  : 'bg-amber-50 text-moss-700 border border-amber-200'
              }`}
            >
              {m.role === 'ai' && (
                <div className="text-[10px] text-amber-700 font-semibold mb-1">🤖 知食AI</div>
              )}
              <div className="leading-relaxed whitespace-pre-wrap">{m.content}</div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 快捷问题 */}
      <div className="flex flex-wrap gap-2 mb-3">
        {quickQuestions.map((q) => (
          <button
            key={q}
            onClick={() => handleSend(q)}
            className="text-xs px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 hover:bg-amber-200"
          >
            {q}
          </button>
        ))}
      </div>

      {/* 输入框 */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
          placeholder={`问问关于${food.name}的健康影响...`}
          className="flex-1 px-4 py-3 rounded-xl border border-amber-200 bg-paper text-moss-700 focus:outline-none focus:border-moss-400"
        />
        <button
          onClick={() => handleSend(input)}
          className="px-5 py-3 rounded-xl bg-moss-700 text-paper btn-press hover:bg-moss-800"
        >
          发送
        </button>
      </div>
    </div>
  )
}

function generateAiReply(
  question: string,
  food: ReturnType<typeof getFoodById> extends infer T ? NonNullable<T> : never,
  persona: ReturnType<typeof getPersonaById> extends infer T ? NonNullable<T> : never,
  result: ReturnType<typeof analyzeFood>
): string {
  const q = question.toLowerCase()

  if (q.includes('多少') || q.includes('分量') || q.includes('量')) {
    return `根据您${persona.name}的情况，${food.name}的建议分量如下：\n\n• 主食：${Math.floor(food.nutrition.carbs * 0.6)}g 碳水（约减少1/3）\n• 总热量控制在 ${Math.floor(food.nutrition.calories * 0.7)} kcal\n\n预计这样调整后，餐后血糖可控制在 ${Math.max(7.5, result.predictedGlucose - 2).toFixed(1)} mmol/L 左右。`
  }

  if (q.includes('降低') || q.includes('调整') || q.includes('怎么')) {
    return `针对${food.name}的健康调整建议：\n\n1. 减少主食1/3（碳水降至 ${Math.floor(food.nutrition.carbs * 0.67)}g）\n2. 搭配一份绿叶蔬菜（降低GI约30%）\n3. 餐后散步20分钟（消耗血糖）\n\n综合调整后预计血糖可降至 ${(result.predictedGlucose - 2.5).toFixed(1)} mmol/L。`
  }

  if (q.includes('运动') || q.includes('散步')) {
    return `餐后运动建议：\n\n• 时间：餐后30分钟开始\n• 方式：快走、太极拳\n• 时长：20-30分钟\n• 强度：微微出汗即可\n\n运动可帮助降低血糖 1.0-1.5 mmol/L，对您${persona.name}而言是有效的辅助手段。`
  }

  if (q.includes('钠') || q.includes('血压')) {
    return `${food.name}含钠 ${food.nutrition.sodium}mg，对您${persona.name}的影响：\n\n• 预计血压上升 ${result.predictedBpChange} mmHg\n• ${food.nutrition.sodium > 1000 ? '⚠️ 钠含量偏高，建议不喝汤底' : '钠含量适中'}\n\n建议全天钠摄入控制在 2000mg 以内。`
  }

  // 默认回复
  return `关于${food.name}：\n\n• 预测餐后血糖：${result.predictedGlucose} mmol/L（${result.riskLevel === 'safe' ? '安全' : result.riskLevel === 'warning' ? '临界' : '超标'}）\n• 血糖增量：+${result.glucoseDelta} mmol/L\n• 血压变化：+${result.predictedBpChange} mmHg\n\n${result.suggestions[0]}`
}
