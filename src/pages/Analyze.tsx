import { useStore } from '../store/useStore'
import { FOODS, getFoodById, getPersonaById } from '../data/foods'
import { analyzeFood } from '../lib/healthEngine'
import PredictionRing from '../components/PredictionRing'
import PersonaBadge from '../components/PersonaBadge'
import { Link } from 'react-router-dom'

export default function Analyze() {
  const { currentPersonaId, currentFoodId, setCurrentFood, addHistory } = useStore()
  const persona = getPersonaById(currentPersonaId)!
  const food = getFoodById(currentFoodId || 'beef_noodle')!
  const result = analyzeFood(food, persona)

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <header className="mb-8">
        <Link to="/" className="text-xs text-amber-700">← 返回首页</Link>
        <h1 className="font-display text-3xl font-bold text-moss-700 mt-3">
          拍照分析
        </h1>
        <p className="text-sm text-moss-500 mt-1">
          选择一道菜，AI 实时预测餐后血糖与血压影响
        </p>
      </header>

      {/* 当前身份 */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-xs text-moss-500">当前身份</span>
        <PersonaBadge type={persona.type} size="md" />
        <Link to="/persona" className="text-xs text-amber-700 underline">切换身份</Link>
      </div>

      {/* 菜品选择 */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-moss-700 mb-3">选择菜品</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {FOODS.map((f) => (
            <button
              key={f.id}
              onClick={() => setCurrentFood(f.id)}
              className={`p-3 rounded-xl border-2 transition-all ${
                f.id === food.id
                  ? 'border-moss-700 bg-moss-100'
                  : 'border-amber-200 bg-paper hover:border-amber-400'
              }`}
            >
              <div className="text-2xl mb-1">{f.emoji}</div>
              <div className="text-[10px] text-moss-700 truncate">{f.name}</div>
            </button>
          ))}
        </div>
      </section>

      {/* 主体：预测环 + 营养 + AI建议 */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* 左：菜品 + 预测环 */}
        <div className="rounded-2xl overflow-hidden bg-paper border border-amber-200">
          <div
            className="h-40 flex items-center justify-center text-6xl"
            style={{ background: food.imageColor }}
          >
            {food.emoji}
          </div>
          <div className="p-6">
            <h3 className="font-display text-xl font-bold text-moss-700 mb-1">
              {food.name}
            </h3>
            <p className="text-xs text-moss-500 mb-4">{food.description}</p>

            <div className="flex justify-center">
              <PredictionRing
                value={result.predictedGlucose}
                level={result.riskLevel}
                size={180}
              />
            </div>
          </div>
        </div>

        {/* 右：营养 + AI建议 */}
        <div className="space-y-4">
          {/* 营养成分 */}
          <div className="rounded-2xl bg-paper border border-amber-200 p-5">
            <h4 className="font-display font-bold text-moss-700 mb-3">营养成分</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <NutritionRow label="热量" value={food.nutrition.calories} unit="kcal" />
              <NutritionRow label="碳水" value={food.nutrition.carbs} unit="g" />
              <NutritionRow label="蛋白质" value={food.nutrition.protein} unit="g" />
              <NutritionRow label="脂肪" value={food.nutrition.fat} unit="g" />
              <NutritionRow label="钠" value={food.nutrition.sodium} unit="mg" />
              <NutritionRow label="GI值" value={food.nutrition.gi} unit="" />
            </div>
          </div>

          {/* 血糖/血压增量 */}
          <div className="rounded-2xl bg-moss-700 text-paper p-5">
            <h4 className="font-display font-bold mb-3">健康影响预测</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs opacity-70 mb-1">血糖增量</div>
                <div className="font-num font-bold text-2xl">
                  +{result.glucoseDelta}
                  <span className="text-xs opacity-70 ml-1">mmol/L</span>
                </div>
              </div>
              <div>
                <div className="text-xs opacity-70 mb-1">血压变化</div>
                <div className="font-num font-bold text-2xl">
                  +{result.predictedBpChange}
                  <span className="text-xs opacity-70 ml-1">mmHg</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI 建议 */}
          <div className="rounded-2xl bg-paper border border-amber-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🤖</span>
              <h4 className="font-display font-bold text-moss-700">AI 个性化建议</h4>
            </div>
            <div className="space-y-2">
              {result.suggestions.map((s, i) => (
                <div
                  key={i}
                  className="text-sm text-moss-700 leading-relaxed p-3 rounded-lg bg-amber-50 border-l-2 border-amber-400"
                >
                  {s}
                </div>
              ))}
            </div>
          </div>

          {/* 后续入口 */}
          <div className="grid grid-cols-3 gap-2">
            <Link
              to="/simulate"
              className="text-center text-xs px-2 py-3 rounded-lg bg-moss-100 text-moss-700 hover:bg-moss-200"
            >
              🎚️ 决策推演
            </Link>
            <Link
              to="/persona"
              className="text-center text-xs px-2 py-3 rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-200"
            >
              🎭 切换身份
            </Link>
            <Link
              to="/coach"
              className="text-center text-xs px-2 py-3 rounded-lg bg-paper border border-amber-200 text-moss-700 hover:bg-amber-50"
            >
              💬 问AI
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

function NutritionRow({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="flex justify-between items-baseline py-1 border-b border-amber-100">
      <span className="text-moss-600">{label}</span>
      <span className="font-num font-semibold text-moss-700">
        {value}
        <span className="text-[10px] text-moss-500 ml-1">{unit}</span>
      </span>
    </div>
  )
}
