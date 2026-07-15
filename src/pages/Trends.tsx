import { useStore } from '../store/useStore'
import { getPersonaById } from '../data/foods'
import PersonaBadge from '../components/PersonaBadge'
import DisclaimerBanner from '../components/DisclaimerBanner'
import { Link } from 'react-router-dom'

/**
 * 知食 · 趋势分析页
 *
 * 7天营养趋势 + AI洞察（Demo用预置数据）
 */
export default function Trends() {
  const { currentPersonaId } = useStore()
  const persona = getPersonaById(currentPersonaId)!

  // 模拟7天数据
  const weekData = generateWeekData()

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <header className="mb-8">
        <Link to="/" className="text-xs text-amber-700">← 返回首页</Link>
        <div className="flex items-center justify-between mt-2">
          <h1 className="font-display text-3xl font-bold text-moss-700">
            7天饮食趋势
          </h1>
          <PersonaBadge type={persona.type} size="md" />
        </div>
        <p className="text-sm text-moss-500 mt-1">
          基于您的慢病身份，AI 分析本周饮食健康趋势
        </p>
      </header>

      {/* 关键指标 */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <MetricCard label="平均餐后血糖" value="9.4" unit="mmol/L" trend="up" delta="+0.8" />
        <MetricCard label="超标餐次" value="5" unit="/21餐" trend="up" delta="+2" />
        <MetricCard label="平均钠摄入" value="1820" unit="mg/日" trend="down" delta="-180" />
        <MetricCard label="健康评分" value="68" unit="/100" trend="down" delta="-5" />
      </section>

      {/* 趋势图 */}
      <section className="rounded-2xl bg-paper border border-amber-200 p-6 mb-6">
        <h3 className="font-display font-bold text-moss-700 mb-4">
          餐后血糖 7 天波动
        </h3>
        <TrendChart data={weekData.glucose} target={8.0} danger={11.1} />
        <div className="flex items-center gap-4 mt-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-moss-700" />
            <span className="text-moss-600">实际血糖</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-signal-warning" />
            <span className="text-moss-600">目标线</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-signal-danger" />
            <span className="text-moss-600">超标线</span>
          </span>
        </div>
      </section>

      {/* AI 洞察 */}
      <section className="rounded-2xl bg-moss-700 text-paper p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🤖</span>
          <h3 className="font-display font-bold text-lg">AI 周报洞察</h3>
        </div>

        <div className="space-y-3">
          <Insight
            type="warning"
            title="碳水摄入偏高"
            content="本周碳水占总热量的58%，高于推荐的50%。主要来自周三的白米粥和周五的炒饼。建议下周用杂粮替代部分精制碳水。"
          />
          <Insight
            type="danger"
            title="血糖波动加剧"
            content="本周有5餐餐后血糖超过10 mmol/L，比上周增加2餐。最高峰值出现在周三晚餐（牛肉面后12.3 mmol/L）。"
          />
          <Insight
            type="safe"
            title="蛋白质摄入良好"
            content="本周蛋白质平均68g/日，达标。继续保持鱼肉、豆制品的优质蛋白来源。"
          />
          <Insight
            type="warning"
            title="钠摄入需控制"
            content="本周平均钠摄入1820mg/日，超过2000mg的有3天。建议减少外食和加工食品。"
          />
        </div>
      </section>

      {/* 建议 */}
      <section className="rounded-2xl bg-paper border border-amber-200 p-6">
        <h3 className="font-display font-bold text-moss-700 mb-3">
          下周调整建议
        </h3>
        <ul className="space-y-2 text-sm text-moss-700">
          <li className="flex items-start gap-2">
            <span className="text-amber-700 mt-0.5">•</span>
            <span>用杂粮粥替代白米粥（GI值从92降至55）</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-700 mt-0.5">•</span>
            <span>主食分量减少1/3，搭配蔬菜</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-700 mt-0.5">•</span>
            <span>餐后20分钟散步，每周至少5次</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-700 mt-0.5">•</span>
            <span>减少外食频率，控制在每周2次以内</span>
          </li>
        </ul>
      </section>

      {/* 免责声明 */}
      <div className="mt-6">
        <DisclaimerBanner />
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  unit,
  trend,
  delta,
}: {
  label: string
  value: string
  unit: string
  trend: 'up' | 'down'
  delta: string
}) {
  const isUp = trend === 'up'
  const isGood = label.includes('评分') ? !isUp : !isUp

  return (
    <div className="rounded-xl bg-paper border border-amber-200 p-4">
      <div className="text-xs text-moss-500">{label}</div>
      <div className="font-num font-bold text-2xl text-moss-700 mt-1">
        {value}
        <span className="text-xs text-moss-500 ml-1">{unit}</span>
      </div>
      <div className={`text-xs mt-1 ${isGood ? 'text-signal-safe' : 'text-signal-danger'}`}>
        {isUp ? '↑' : '↓'} {delta}
      </div>
    </div>
  )
}

function Insight({
  type,
  title,
  content,
}: {
  type: 'safe' | 'warning' | 'danger'
  title: string
  content: string
}) {
  const colorMap = {
    safe: 'bg-signal-safe',
    warning: 'bg-signal-warning',
    danger: 'bg-signal-danger',
  }
  const labelMap = {
    safe: '良好',
    warning: '关注',
    danger: '警示',
  }

  return (
    <div className="p-3 rounded-lg bg-paper/10">
      <div className="flex items-center gap-2 mb-1">
        <span className={`w-2 h-2 rounded-full ${colorMap[type]}`} />
        <span className="font-semibold text-sm">{title}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-paper/20">
          {labelMap[type]}
        </span>
      </div>
      <p className="text-xs opacity-90 leading-relaxed">{content}</p>
    </div>
  )
}

function generateWeekData() {
  // 模拟7天血糖数据
  return {
    glucose: [9.2, 8.8, 12.3, 9.5, 10.8, 8.1, 7.5],
  }
}

function TrendChart({
  data,
  target,
  danger,
}: {
  data: number[]
  target: number
  danger: number
}) {
  const maxVal = Math.max(...data, danger) + 1
  const minVal = Math.min(...data, target) - 1
  const range = maxVal - minVal

  return (
    <svg viewBox="0 0 700 200" className="w-full">
      <defs>
        <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D4A574" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#D4A574" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* 目标线 */}
      <line
        x1="0"
        y1={100 - ((target - minVal) / range) * 100}
        x2="700"
        y2={100 - ((target - minVal) / range) * 100}
        stroke="#E6B655"
        strokeWidth="1"
        strokeDasharray="4 3"
      />

      {/* 超标线 */}
      <line
        x1="0"
        y1={100 - ((danger - minVal) / range) * 100}
        x2="700"
        y2={100 - ((danger - minVal) / range) * 100}
        stroke="#C8553D"
        strokeWidth="1"
        strokeDasharray="4 3"
      />

      {/* 数据点曲线 */}
      <path
        d={`M 50 ${100 - ((data[0] - minVal) / range) * 100} ` +
          data.map((v, i) => {
            const x = 50 + (i / (data.length - 1)) * 600
            const y = 100 - ((v - minVal) / range) * 100
            return `L ${x} ${y}`
          }).join(' ')}
        fill="none"
        stroke="#1F3A2E"
        strokeWidth="2.5"
      />

      {/* 数据点 */}
      {data.map((v, i) => {
        const x = 50 + (i / (data.length - 1)) * 600
        const y = 100 - ((v - minVal) / range) * 100
        const isOver = v >= danger
        return (
          <g key={i}>
            <circle
              cx={x}
              cy={y}
              r="5"
              fill={isOver ? '#C8553D' : '#1F3A2E'}
              stroke="#FAF6EE"
              strokeWidth="2"
            />
            <text
              x={x}
              y={y - 10}
              fontSize="10"
              fill="#1F3A2E"
              textAnchor="middle"
              fontFamily="JetBrains Mono"
              fontWeight="bold"
            >
              {v}
            </text>
            <text
              x={x}
              y={115}
              fontSize="9"
              fill="#7F5836"
              textAnchor="middle"
            >
              {['周一', '周二', '周三', '周四', '周五', '周六', '周日'][i]}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
