import { useState } from 'react'
import { useStore } from '../store/useStore'
import { FOODS, getPersonaById, PERSONAS } from '../data/foods'
import { analyzeFood } from '../lib/healthEngine'
import PredictionRing from '../components/PredictionRing'
import PersonaBadge from '../components/PersonaBadge'
import { Link } from 'react-router-dom'

/**
 * 知食 · 核心亮点4
 * 为父母分析 — 情感杀手锏
 *
 * 评委家庭代入：让评委从"评估 Demo"切换到"我想用"
 */
export default function Parent() {
  const { setCurrentFood, setCurrentPersona } = useStore()
  const [parentPersonaId, setParentPersonaId] = useState('diabetes_hypertension')
  const [selectedFoodId, setSelectedFoodId] = useState('beef_noodle')
  const [parentName, setParentName] = useState('父亲')

  const persona = getPersonaById(parentPersonaId)!
  const food = FOODS.find((f) => f.id === selectedFoodId)!
  const result = analyzeFood(food, persona)

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <header className="mb-8">
        <Link to="/" className="text-xs text-amber-700">← 返回首页</Link>
        <h1 className="font-display text-3xl font-bold text-moss-700 mt-3">
          为父母分析 💝
        </h1>
        <p className="text-sm text-moss-500 mt-1">
          替爸妈分析他们常吃的菜，给他们一份关怀建议
        </p>
      </header>

      {/* 配置父母信息 */}
      <section className="rounded-2xl bg-gradient-to-br from-amber-50 to-paper border border-amber-200 p-6 mb-6">
        <h2 className="font-display font-bold text-moss-700 mb-4">
          为哪位家人分析？
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 关系 */}
          <div>
            <label className="text-xs text-moss-500 mb-1 block">称呼</label>
            <input
              type="text"
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              placeholder="父亲 / 母亲 / 爷爷..."
              className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-paper text-moss-700"
            />
          </div>

          {/* 慢病情况 */}
          <div>
            <label className="text-xs text-moss-500 mb-1 block">慢病情况</label>
            <div className="flex flex-wrap gap-2">
              {PERSONAS.filter((p) => p.id !== 'healthy').map((p) => (
                <button
                  key={p.id}
                  onClick={() => setParentPersonaId(p.id)}
                  className={`px-3 py-2 rounded-lg text-xs border-2 transition-all ${
                    p.id === parentPersonaId
                      ? 'border-moss-700 bg-moss-100 text-moss-700'
                      : 'border-amber-200 bg-paper text-moss-600'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 父母健康卡 */}
        <div className="mt-4 p-4 rounded-xl bg-paper border border-amber-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center text-xl">
              {parentName === '母亲' ? '👩‍🦳' : parentName === '爷爷' ? '👴' : '👨‍🦳'}
            </div>
            <div className="flex-1">
              <div className="font-display font-bold text-moss-700">
                {parentName} · {persona.age}岁
              </div>
              <div className="flex items-center gap-2 mt-1">
                <PersonaBadge type={persona.type} size="sm" />
                <span className="text-xs text-moss-500">
                  空腹 {persona.fastingGlucose} · 血压 {persona.bloodPressureHigh}/{persona.bloodPressureLow}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 选择菜品 */}
      <section className="mb-6">
        <h3 className="text-sm font-semibold text-moss-700 mb-3">
          {parentName}常吃的菜
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {FOODS.slice(0, 8).map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFoodId(f.id)}
              className={`p-3 rounded-xl border-2 transition-all ${
                f.id === selectedFoodId
                  ? 'border-amber-400 bg-amber-50'
                  : 'border-amber-200 bg-paper'
              }`}
            >
              <div className="text-3xl mb-1">{f.emoji}</div>
              <div className="text-xs text-moss-700">{f.name}</div>
            </button>
          ))}
        </div>
      </section>

      {/* AI 关怀分析 */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 左：预测环 */}
        <div className="rounded-2xl bg-paper border border-amber-200 p-6">
          <h3 className="font-display font-bold text-moss-700 mb-1">
            对{parentName}的影响
          </h3>
          <p className="text-xs text-moss-500 mb-4">{food.emoji} {food.name}</p>

          <div className="flex justify-center mb-4">
            <PredictionRing
              value={result.predictedGlucose}
              level={result.riskLevel}
              size={180}
              key={`${food.id}-${parentPersonaId}`}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-sm">
            <div className="p-2 rounded-lg bg-amber-50">
              <div className="text-xs text-moss-500">血糖增量</div>
              <div className="font-num font-bold text-moss-700">+{result.glucoseDelta}</div>
            </div>
            <div className="p-2 rounded-lg bg-amber-50">
              <div className="text-xs text-moss-500">血压变化</div>
              <div className="font-num font-bold text-moss-700">+{result.predictedBpChange}</div>
            </div>
          </div>
        </div>

        {/* 右：关怀建议 */}
        <div className="rounded-2xl bg-moss-700 text-paper p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">💝</span>
            <h3 className="font-display font-bold">给{parentName}的关怀建议</h3>
          </div>

          <div className="space-y-3">
            {result.suggestions.map((s, i) => (
              <div
                key={i}
                className="text-sm leading-relaxed p-3 rounded-lg bg-paper/10"
              >
                {s}
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-paper/20">
            <p className="text-xs opacity-80 italic">
              建议您抽空陪{parentName}去复查指标，把这份分析结果分享给{parentName}的医生参考。
            </p>
          </div>
        </div>
      </section>

      {/* 后续 */}
      <div className="mt-6 grid grid-cols-3 gap-2">
        <Link
          to="/analyze"
          onClick={() => {
            setCurrentPersona(parentPersonaId)
            setCurrentFood(selectedFoodId)
          }}
          className="text-center text-xs px-3 py-3 rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-200"
        >
          📊 查看完整分析
        </Link>
        <Link
          to="/simulate"
          onClick={() => {
            setCurrentPersona(parentPersonaId)
            setCurrentFood(selectedFoodId)
          }}
          className="text-center text-xs px-3 py-3 rounded-lg bg-moss-100 text-moss-700 hover:bg-moss-200"
        >
          🎚️ 帮{parentName}推演
        </Link>
        <Link
          to="/coach"
          onClick={() => {
            setCurrentPersona(parentPersonaId)
            setCurrentFood(selectedFoodId)
          }}
          className="text-center text-xs px-3 py-3 rounded-lg bg-paper border border-amber-200 text-moss-700"
        >
          💬 问AI
        </Link>
      </div>
    </div>
  )
}
