import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { FOODS, getFoodById, getPersonaById, PERSONAS } from '../data/foods'
import { analyzeFood } from '../lib/healthEngine'
import { personaApi, setToken as setSharedToken } from '../../shared/api/client'
import type { Persona as BackendPersona } from '../../shared/types'
import PredictionRing from '../components/PredictionRing'
import PersonaBadge from '../components/PersonaBadge'
import { Link } from 'react-router-dom'

/**
 * 知食 · 核心亮点2
 * 慢病 Persona 切换器
 *
 * 同一道菜，3种慢病身份，3种AI建议 — AI 不可替代证明
 *
 * W13+ 双源：
 * - 默认展示本地预置 PERSONAS（Demo 评委快速体验）
 * - 登录用户可在顶部查看后端 Persona 列表（如有），点击切换
 * - 通过 condition 映射到本地 Persona 的健康系数（保留算法一致性）
 */
export default function Persona() {
  const { currentPersonaId, setCurrentPersona, currentFoodId, setCurrentFood, token, user } = useStore()
  const persona = getPersonaById(currentPersonaId)!
  const food = getFoodById(currentFoodId || 'beef_noodle')!
  const result = analyzeFood(food, persona)

  // 后端 Persona 状态
  const [backendPersonas, setBackendPersonas] = useState<BackendPersona[]>([])
  const [backendLoading, setBackendLoading] = useState(false)
  const [showBackendSection, setShowBackendSection] = useState(false)

  // 同步 shared client token
  useEffect(() => {
    if (token) {
      setSharedToken(token)
    }
  }, [token])

  // 登录用户加载后端 Persona
  useEffect(() => {
    if (token && user) {
      loadBackendPersonas()
    }
  }, [token, user])

  const loadBackendPersonas = async () => {
    setBackendLoading(true)
    try {
      const res = await personaApi.list()
      setBackendPersonas(res.personas)
      setShowBackendSection(res.personas.length > 0)
    } catch (err) {
      console.warn('加载后端 Persona 失败:', err)
    } finally {
      setBackendLoading(false)
    }
  }

  // 后端 Persona condition → 本地预置 Persona 映射
  const conditionToPresetId: Record<string, string> = {
    diabetes: 'diabetes_t2',
    hypertension: 'hypertension',
    diabetes_hypertension: 'diabetes_hypertension',
    healthy: 'healthy',
  }

  const handleBackendPersonaClick = (bp: BackendPersona) => {
    const presetId = conditionToPresetId[bp.condition]
    if (presetId) {
      setCurrentPersona(presetId)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <header className="mb-8">
        <Link to="/" className="text-xs text-amber-700">← 返回首页</Link>
        <h1 className="font-display text-3xl font-bold text-moss-700 mt-3">
          同一道菜 · 3种 AI 建议
        </h1>
        <p className="text-sm text-moss-500 mt-1">
          切换慢病身份，看 AI 如何给出截然不同的健康预测 — 这是 AI 不可替代的核心能力
        </p>
      </header>

      {/* 我的后端 Persona（登录用户专属） */}
      {token && user && showBackendSection && (
        <section className="mb-6 rounded-2xl bg-amber-50 border border-amber-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-moss-700">
              📋 我的后端 Persona（{backendPersonas.length}）
            </h3>
            <button
              onClick={() => setShowBackendSection(!showBackendSection)}
              className="text-xs text-amber-700"
            >
              {showBackendSection ? '收起' : '展开'}
            </button>
          </div>
          {backendLoading ? (
            <div className="text-xs text-moss-500">加载中...</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {backendPersonas.map((bp) => {
                const presetId = conditionToPresetId[bp.condition]
                const isActive = currentPersonaId === presetId
                return (
                  <button
                    key={bp.id}
                    onClick={() => handleBackendPersonaClick(bp)}
                    className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                      isActive
                        ? 'bg-moss-700 text-paper border-moss-700'
                        : 'bg-paper border-amber-200 text-moss-700 hover:border-amber-400'
                    }`}
                  >
                    {bp.name} · {bp.relation === 'self' ? '本人' : bp.relation === 'parent' ? '父母' : bp.relation}
                  </button>
                )
              })}
            </div>
          )}
          <p className="text-[10px] text-moss-500 mt-2">
            点击切换为对应慢病类型的演示数据（实际后端数据需在分析时自动调用）
          </p>
        </section>
      )}

      {/* 菜品选择 */}
      <section className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-moss-500 mr-2">选菜：</span>
          {FOODS.slice(0, 6).map((f) => (
            <button
              key={f.id}
              onClick={() => setCurrentFood(f.id)}
              className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                f.id === food.id
                  ? 'bg-moss-700 text-paper border-moss-700'
                  : 'bg-paper border-amber-200 text-moss-700'
              }`}
            >
              {f.emoji} {f.name}
            </button>
          ))}
        </div>
      </section>

      {/* Persona 切换器（本地预置 Demo 数据） */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-semibold text-moss-700">慢病身份切换</h2>
          <span className="text-[10px] text-moss-400">（演示数据）</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {PERSONAS.map((p) => (
            <button
              key={p.id}
              onClick={() => setCurrentPersona(p.id)}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                p.id === currentPersonaId
                  ? 'border-moss-700 bg-moss-100'
                  : 'border-amber-200 bg-paper'
              }`}
            >
              <PersonaBadge type={p.type} size="sm" />
              <div className="text-xs text-moss-600 mt-2">{p.name}</div>
              <div className="text-[10px] text-moss-500 mt-1">
                {p.age}岁 · 空腹{p.fastingGlucose}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 对比展示区 */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 左：预测环 */}
        <div className="rounded-2xl bg-paper border border-amber-200 p-6">
          <h3 className="font-display font-bold text-moss-700 mb-2">{food.name}</h3>
          <div className="text-3xl mb-4">{food.emoji}</div>

          <div className="flex justify-center mb-4">
            <PredictionRing
              value={result.predictedGlucose}
              level={result.riskLevel}
              size={180}
              key={`${food.id}-${persona.id}`} // 切换时重新触发动画
            />
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-lg bg-amber-50">
              <div className="text-xs text-moss-500">血糖增量</div>
              <div className="font-num font-bold text-xl text-moss-700">
                +{result.glucoseDelta}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-amber-50">
              <div className="text-xs text-moss-500">血压变化</div>
              <div className="font-num font-bold text-xl text-moss-700">
                +{result.predictedBpChange}
              </div>
            </div>
          </div>
        </div>

        {/* 右：AI建议 */}
        <div className="space-y-3">
          <div className="rounded-2xl bg-moss-700 text-paper p-5">
            <div className="flex items-center gap-2 mb-3">
              <PersonaBadge type={persona.type} size="sm" />
              <span className="text-xs opacity-80">的个性化建议</span>
            </div>
            <div className="space-y-2">
              {result.suggestions.map((s, i) => (
                <div key={i} className="text-sm leading-relaxed p-3 rounded-lg bg-paper/10">
                  {s}
                </div>
              ))}
            </div>
          </div>

          {/* Persona 详情 */}
          <div className="rounded-2xl bg-paper border border-amber-200 p-5">
            <h4 className="font-display font-bold text-moss-700 mb-3 text-sm">
              当前身份详情
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <DetailItem label="年龄" value={`${persona.age}岁`} />
              <DetailItem label="BMI" value={persona.bmi.toFixed(1)} />
              <DetailItem label="空腹血糖" value={`${persona.fastingGlucose} mmol/L`} />
              <DetailItem label="餐后血糖" value={`${persona.postprandialGlucose} mmol/L`} />
              <DetailItem label="血压" value={`${persona.bloodPressureHigh}/${persona.bloodPressureLow}`} />
              <DetailItem label="用药" value={persona.medication} />
            </div>
          </div>

          <Link
            to="/analyze"
            className="block text-center text-sm py-3 rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-200"
          >
            → 查看完整分析
          </Link>
        </div>
      </section>
    </div>
  )
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-moss-500">{label}</div>
      <div className="text-moss-700 font-medium">{value}</div>
    </div>
  )
}
