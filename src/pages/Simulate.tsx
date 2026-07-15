import { useState, useEffect, useMemo } from 'react'
import { useStore } from '../store/useStore'
import { getFoodById, getPersonaById } from '../data/foods'
import { simulateAdjustmentBackend, type SimulateResult } from '../lib/api'
import { analyzeFood, simulateAdjustment } from '../lib/healthEngine'
import { getRiskLevel } from '../store/useStore'
import PredictionRing from '../components/PredictionRing'
import PersonaBadge from '../components/PersonaBadge'
import DisclaimerBanner from '../components/DisclaimerBanner'
import { Link } from 'react-router-dom'

/**
 * 知食 · 核心亮点3
 * 饮食决策推演 — 医疗级 AI 感
 *
 * 滑块调整分量/搭配/运动，实时看血糖曲线变化
 *
 * W9-10 集成：优先调用后端 /api/optimize/simulate，后端不可用时降级到本地 healthEngine。
 */
export default function Simulate() {
  const { currentPersonaId, currentFoodId } = useStore()
  const persona = getPersonaById(currentPersonaId)!
  const food = getFoodById(currentFoodId || 'beef_noodle')!

  const [carbReduction, setCarbReduction] = useState(0) // 0-0.7
  const [addVegetable, setAddVegetable] = useState(false)
  const [exercise, setExercise] = useState(0) // 0-60 分钟

  // 基线（不调整）：本地计算，避免每次滑块都调用后端
  const baseline = useMemo(() => analyzeFood(food, persona), [food, persona])

  // 调整后：调用后端推演
  const [adjusted, setAdjusted] = useState<SimulateResult>(() => ({
    predictedGlucose: baseline.predictedGlucose,
    delta: 0,
    exerciseDelta: 0,
    riskLevel: baseline.riskLevel,
  }))
  const [disclaimer, setDisclaimer] = useState<{ text: string; version: string; docType: string } | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [useBackend, setUseBackend] = useState(true)

  // 滑块变化时调用后端推演（防抖 300ms）
  useEffect(() => {
    let cancelled = false
    const timer = setTimeout(() => {
      setLoading(true)
      simulateAdjustmentBackend(food, persona, {
        carbReduction,
        addVegetable,
        exercise,
      })
        .then((r) => {
          if (!cancelled) {
            setAdjusted(r)
            setDisclaimer(r.disclaimer)
            setUseBackend(true)
            setLoading(false)
          }
        })
        .catch(() => {
          if (!cancelled) {
            // 降级到本地
            const local = simulateAdjustment(food, persona, {
              carbReduction,
              addVegetable,
              exercise,
            })
            setAdjusted({
              predictedGlucose: local.predictedGlucose,
              delta: local.delta,
              exerciseDelta: local.exerciseDelta,
              riskLevel: getRiskLevel(local.predictedGlucose),
            })
            setUseBackend(false)
            setLoading(false)
          }
        })
    }, 300)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [food, persona, carbReduction, addVegetable, exercise])

  // 生成血糖曲线数据（模拟）
  const baselineCurve = generateGlucoseCurve(persona.fastingGlucose, baseline.predictedGlucose)
  const adjustedCurve = generateGlucoseCurve(persona.fastingGlucose, adjusted.predictedGlucose)

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <header className="mb-8">
        <Link to="/" className="text-xs text-amber-700">← 返回首页</Link>
        <h1 className="font-display text-3xl font-bold text-moss-700 mt-3">
          饮食决策推演
        </h1>
        <p className="text-sm text-moss-500 mt-1">
          拖动滑块，实时看血糖曲线如何变化 — 医疗级 AI 推理
        </p>
        {!useBackend && (
          <div className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2">
            ⚠️ 后端不可用，当前使用本地简化引擎
          </div>
        )}
      </header>

      {/* 当前状态 */}
      <div className="flex items-center gap-3 mb-6">
        <PersonaBadge type={persona.type} />
        <span className="text-sm text-moss-700">{food.emoji} {food.name}</span>
        {loading && (
          <span className="text-xs text-moss-500 animate-pulse">推演中...</span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 左：滑块控制 */}
        <div className="space-y-4">
          {/* 主食分量 */}
          <SliderCard
            title="🍚 主食分量"
            description="减少主食碳水摄入"
            min={0}
            max={70}
            step={5}
            value={carbReduction * 100}
            unit="%"
            onChange={(v) => setCarbReduction(v / 100)}
            accent="amber"
          />

          {/* 搭配蔬菜 */}
          <div className="rounded-2xl bg-paper border border-amber-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="font-display font-bold text-moss-700">🥦 搭配蔬菜</div>
                <div className="text-xs text-moss-500">增加膳食纤维，降低 GI</div>
              </div>
              <button
                onClick={() => setAddVegetable(!addVegetable)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  addVegetable ? 'bg-signal-safe' : 'bg-amber-200'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-paper transition-transform ${
                    addVegetable ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
            {addVegetable && (
              <div className="text-xs text-signal-safe mt-2">
                ✓ GI 值降低 30%，血糖反应更平缓
              </div>
            )}
          </div>

          {/* 餐后运动 */}
          <SliderCard
            title="🚶 餐后运动"
            description="散步帮助消耗血糖"
            min={0}
            max={60}
            step={5}
            value={exercise}
            unit="分钟"
            onChange={(v) => setExercise(v)}
            accent="moss"
          />
        </div>

        {/* 右：预测结果对比 */}
        <div className="space-y-4">
          <div className="rounded-2xl bg-paper border border-amber-200 p-5">
            <h3 className="font-display font-bold text-moss-700 mb-4">预测对比</h3>

            <div className="grid grid-cols-2 gap-3">
              {/* Baseline */}
              <div className="text-center">
                <div className="text-xs text-moss-500 mb-2">不调整</div>
                <PredictionRing
                  value={baseline.predictedGlucose}
                  level={baseline.riskLevel}
                  size={120}
                  animate={false}
                />
              </div>
              {/* Adjusted */}
              <div className="text-center">
                <div className="text-xs text-amber-700 mb-2 font-semibold">调整后</div>
                <PredictionRing
                  value={adjusted.predictedGlucose}
                  level={adjusted.riskLevel}
                  size={120}
                  animate={false}
                  key={`${carbReduction}-${addVegetable}-${exercise}`}
                />
              </div>
            </div>

            {/* 血糖曲线对比 */}
            <div className="mt-6">
              <div className="text-xs text-moss-500 mb-2">餐后2小时血糖曲线</div>
              <GlucoseCurve baseline={baselineCurve} adjusted={adjustedCurve} />
            </div>
          </div>

          {/* 推演结论 */}
          <div className="rounded-2xl bg-moss-700 text-paper p-5">
            <h4 className="font-display font-bold mb-3">推演结论</h4>
            <div className="space-y-2 text-sm">
              <div>
                原预测：<span className="font-num">{baseline.predictedGlucose}</span> mmol/L
              </div>
              <div>
                调整后：<span className="font-num">{adjusted.predictedGlucose}</span> mmol/L
              </div>
              <div className="pt-2 border-t border-paper/20">
                变化：
                <span className={`font-num font-bold ml-2 ${adjusted.delta < 0 ? 'text-amber-300' : 'text-signal-danger'}`}>
                  {adjusted.delta > 0 ? '+' : ''}{adjusted.delta}
                </span>
                <span className="text-xs opacity-70 ml-1">mmol/L</span>
              </div>
              {adjusted.exerciseDelta > 0 && (
                <div className="text-xs opacity-80 mt-2">
                  其中运动贡献降低 {adjusted.exerciseDelta} mmol/L
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 免责声明 */}
      <div className="mt-6">
        <DisclaimerBanner disclaimer={disclaimer} />
      </div>
    </div>
  )
}

function SliderCard({
  title,
  description,
  min,
  max,
  step,
  value,
  unit,
  onChange,
  accent,
}: {
  title: string
  description: string
  min: number
  max: number
  step: number
  value: number
  unit: string
  onChange: (v: number) => void
  accent: 'amber' | 'moss'
}) {
  const accentColor = accent === 'amber' ? 'accent-amber-500' : 'accent-moss-500'
  return (
    <div className="rounded-2xl bg-paper border border-amber-200 p-5">
      <div className="flex items-baseline justify-between mb-2">
        <div>
          <div className="font-display font-bold text-moss-700">{title}</div>
          <div className="text-xs text-moss-500">{description}</div>
        </div>
        <div className="font-num font-bold text-moss-700">
          {value}<span className="text-xs text-moss-500 ml-1">{unit}</span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full h-2 rounded-lg appearance-none cursor-pointer bg-amber-100 ${accentColor}`}
      />
    </div>
  )
}

function generateGlucoseCurve(fasting: number, peak: number): number[] {
  // 0-120 分钟的血糖曲线
  const points = 25
  const curve: number[] = []
  for (let i = 0; i < points; i++) {
    const t = i / (points - 1) * 120 // 分钟
    if (t === 0) {
      curve.push(fasting)
    } else {
      // 峰值在30-45分钟左右，然后下降
      const peakTime = 35
      const decay = Math.exp(-Math.pow((t - peakTime) / 50, 2))
      curve.push(fasting + (peak - fasting) * decay)
    }
  }
  return curve
}

function GlucoseCurve({ baseline, adjusted }: { baseline: number[]; adjusted: number[] }) {
  const maxVal = Math.max(...baseline, ...adjusted) + 1
  const minVal = Math.min(...baseline, ...adjusted) - 1
  const range = maxVal - minVal

  return (
    <svg viewBox="0 0 300 100" className="w-full">
      <defs>
        <linearGradient id="curve-baseline" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C8553D" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#C8553D" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="curve-adjusted" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5C8A5C" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#5C8A5C" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* 基线曲线 */}
      <path
        d={`M 0 ${100 - ((baseline[0] - minVal) / range) * 100} ` +
          baseline.map((v, i) => `L ${(i / (baseline.length - 1)) * 300} ${100 - ((v - minVal) / range) * 100}`).join(' ')}
        fill="none"
        stroke="#C8553D"
        strokeWidth="2"
        strokeDasharray="4 3"
      />

      {/* 调整后曲线 */}
      <path
        d={`M 0 ${100 - ((adjusted[0] - minVal) / range) * 100} ` +
          adjusted.map((v, i) => `L ${(i / (adjusted.length - 1)) * 300} ${100 - ((v - minVal) / range) * 100}`).join(' ')}
        fill="none"
        stroke="#5C8A5C"
        strokeWidth="2.5"
      />

      {/* 图例 */}
      <g transform="translate(8, 8)">
        <line x1="0" y1="4" x2="14" y2="4" stroke="#C8553D" strokeWidth="2" strokeDasharray="3 2" />
        <text x="18" y="7" fontSize="8" fill="#1F3A2E">不调整</text>
        <line x1="60" y1="4" x2="74" y2="4" stroke="#5C8A5C" strokeWidth="2.5" />
        <text x="78" y="7" fontSize="8" fill="#1F3A2E">调整后</text>
      </g>
    </svg>
  )
}
