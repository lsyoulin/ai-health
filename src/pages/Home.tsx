import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { FOODS, getFoodById } from '../data/foods'
import { getPersonaById } from '../data/foods'
import { useStore, getRiskLevel, getRiskColor, getRiskLabel } from '../store/useStore'
import { analyzeFood } from '../lib/healthEngine'
import PredictionRing from '../components/PredictionRing'
import PersonaBadge from '../components/PersonaBadge'

export default function Home() {
  const navigate = useNavigate()
  const { currentPersonaId, setCurrentFood } = useStore()
  const persona = getPersonaById(currentPersonaId)!

  // 实时演示菜品（默认展示牛肉面）
  const demoFood = getFoodById('beef_noodle')!
  const demoResult = analyzeFood(demoFood, persona)

  // 轮播演示菜品（每5秒切换）
  const [carouselIdx, setCarouselIdx] = useState(0)
  const carouselFoods = ['beef_noodle', 'rice_braised_pork', 'steamed_fish', 'porridge_cucumber']
  useEffect(() => {
    const timer = setInterval(() => {
      setCarouselIdx((prev) => (prev + 1) % carouselFoods.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])
  const currentCarouselFood = getFoodById(carouselFoods[carouselIdx])!
  const currentCarouselResult = analyzeFood(currentCarouselFood, persona)

  const handleStartAnalyze = (foodId: string) => {
    setCurrentFood(foodId)
    navigate('/analyze')
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 md:py-12">
      {/* ===== Hero 区：3秒惊艳 ===== */}
      <section className="relative mb-12 md:mb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* 左侧：品牌主张 */}
          <div className="lg:col-span-7 space-y-6 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-moss-700 text-paper text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-breathe" />
              慢病饮食 AI 伙伴 · TRAE 大赛作品
            </div>

            <h1 className="font-display text-6xl md:text-8xl font-black leading-[0.95] text-moss-700">
              知食
              <span className="block text-2xl md:text-3xl font-normal text-amber-700 mt-3 tracking-wide">
                让每一口都被懂
              </span>
            </h1>

            <p className="text-lg md:text-xl text-moss-600 leading-relaxed max-w-xl">
              拍一张饭菜，AI 实时预测
              <span className="font-semibold text-moss-700">餐后血糖</span>、
              <span className="font-semibold text-moss-700">血压影响</span>，并给出个性化调整建议。
            </p>

            <p className="text-sm text-amber-700 italic border-l-2 border-amber-400 pl-4">
              别人帮你<span className="line-through opacity-60">记录饮食</span>，
              <span className="font-semibold">我们帮你预测饮食的健康后果</span>。
            </p>

            {/* 当前 Persona 状态 */}
            <div className="flex items-center gap-3 pt-2">
              <span className="text-xs text-moss-500">当前身份</span>
              <PersonaBadge type={persona.type} size="md" />
              <Link to="/persona" className="text-xs text-amber-700 underline underline-offset-4">
                切换 →
              </Link>
            </div>
          </div>

          {/* 右侧：实时演示菜品卡（带预测环 mini 版） */}
          <div className="lg:col-span-5">
            <div
              className="relative rounded-3xl overflow-hidden shadow-2xl card-hover"
              style={{ background: currentCarouselFood.imageColor }}
              onClick={() => handleStartAnalyze(currentCarouselFood.id)}
              role="button"
              tabIndex={0}
            >
              <div className="p-8 text-paper">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs uppercase tracking-widest opacity-80">
                    实时演示
                  </span>
                  <span className="text-2xl">{currentCarouselFood.emoji}</span>
                </div>

                <h3 className="font-display text-3xl font-bold mb-1">
                  {currentCarouselFood.name}
                </h3>
                <p className="text-xs opacity-80 mb-6">
                  {currentCarouselFood.description}
                </p>

                {/* 预测环 mini 版 */}
                <div className="flex items-center gap-4">
                  <PredictionRing
                    value={currentCarouselResult.predictedGlucose}
                    level={currentCarouselResult.riskLevel}
                    size={120}
                    subtitle="餐后血糖"
                  />
                  <div className="flex-1 space-y-2">
                    <RiskLabel level={currentCarouselResult.riskLevel} />
                    <div className="text-2xl font-num font-bold">
                      +{currentCarouselResult.glucoseDelta}{' '}
                      <span className="text-xs opacity-70">mmol/L ↑</span>
                    </div>
                    {currentCarouselResult.predictedBpChange > 1 && (
                      <div className="text-sm opacity-90">
                        血压 +{currentCarouselResult.predictedBpChange} mmHg
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-paper/20 text-xs opacity-90">
                  <span className="opacity-70">AI · </span>
                  {currentCarouselResult.suggestion.slice(0, 60)}...
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 3入口卡片：评委决策路径 ===== */}
      <section className="mb-16 md:mb-20">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-moss-700">
            从这里开始
          </h2>
          <span className="text-xs text-moss-500">
            评委 1 分钟体验路径 ↓
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 主推：分析我的饮食 */}
          <EntryCard
            title="分析我的饮食"
            subtitle="拍照即知健康后果"
            description="基于您的慢病身份，AI 实时预测餐后血糖、血压影响"
            emoji="📸"
            primary
            onClick={() => handleStartAnalyze('beef_noodle')}
            highlight="3秒惊艳"
          />

          {/* 情感杀手锏：为父母分析 */}
          <EntryCard
            title="为父母分析"
            subtitle="给爸妈的健康关怀"
            description="配置父母慢病情况，分析他们常吃菜的健康影响"
            emoji="💝"
            onClick={() => navigate('/parent')}
            highlight="情感共鸣"
          />

          {/* AI 不可替代证明：演示场景 */}
          <EntryCard
            title="演示场景"
            subtitle="同一道菜，3种AI建议"
            description="切换慢病身份，看AI如何给出截然不同的健康预测"
            emoji="🎭"
            onClick={() => navigate('/persona')}
            highlight="AI不可替代"
          />
        </div>
      </section>

      {/* ===== 菜品库快速访问 ===== */}
      <section className="mb-12">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="font-display text-xl md:text-2xl font-bold text-moss-700">
            试试这些菜
          </h2>
          <span className="text-xs text-moss-500">
            点击任意菜品立即分析
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {FOODS.slice(0, 8).map((food) => {
            const result = analyzeFood(food, persona)
            return (
              <button
                key={food.id}
                onClick={() => handleStartAnalyze(food.id)}
                className="group text-left rounded-2xl overflow-hidden border border-amber-200 hover:border-moss-400 card-hover btn-press bg-paper"
              >
                <div
                  className="h-20 flex items-center justify-center text-4xl"
                  style={{ background: food.imageColor }}
                >
                  {food.emoji}
                </div>
                <div className="p-3">
                  <div className="font-display font-bold text-sm text-moss-700 mb-1 truncate">
                    {food.name}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-num font-bold ${getRiskColor(result.riskLevel)}`}>
                      {result.predictedGlucose.toFixed(1)}
                    </span>
                    <span className="text-[10px] text-moss-500">
                      {food.nutrition.calories}kcal
                    </span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* ===== 核心价值主张 ===== */}
      <section className="border-t border-amber-200 pt-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <ValueProp
            title="预测，而非记录"
            description="别人告诉你这碗面75g碳水。我们告诉你这碗面让你的血糖升到11.2 mmol/L。"
          />
          <ValueProp
            title="个性化，而非通用"
            description="同一道菜，对糖尿病和高血压患者，AI 给出截然不同的健康建议。"
          />
          <ValueProp
            title="懂你，而非数据"
            description="从营养数据到健康后果，从健康后果到关怀建议。AI 不只是识别，是懂你。"
          />
        </div>
      </section>
    </div>
  )
}

function RiskLabel({ level }: { level: 'safe' | 'warning' | 'danger' }) {
  const colorMap = {
    safe: 'bg-signal-safe',
    warning: 'bg-signal-warning',
    danger: 'bg-signal-danger',
  }
  const labelMap = {
    safe: '安全',
    warning: '临界',
    danger: '超标',
  }
  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-paper/20 backdrop-blur-sm">
      <span className={`w-2 h-2 rounded-full ${colorMap[level]}`} />
      <span className="text-xs font-semibold">{labelMap[level]}</span>
    </div>
  )
}

function EntryCard({
  title,
  subtitle,
  description,
  emoji,
  primary,
  onClick,
  highlight,
}: {
  title: string
  subtitle: string
  description: string
  emoji: string
  primary?: boolean
  onClick: () => void
  highlight: string
}) {
  return (
    <button
      onClick={onClick}
      className={`group text-left p-6 rounded-2xl border-2 card-hover btn-press relative overflow-hidden ${
        primary
          ? 'bg-moss-700 text-paper border-moss-700'
          : 'bg-paper text-moss-700 border-amber-200 hover:border-moss-400'
      }`}
    >
      <div className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-moss-700 font-bold">
        {highlight}
      </div>

      <div className="text-4xl mb-3">{emoji}</div>

      <h3 className="font-display text-xl font-bold mb-1">{title}</h3>
      <p className={`text-sm font-medium mb-2 ${primary ? 'text-amber-300' : 'text-amber-700'}`}>
        {subtitle}
      </p>
      <p className={`text-xs leading-relaxed ${primary ? 'text-paper/80' : 'text-moss-500'}`}>
        {description}
      </p>

      <div className={`mt-4 inline-flex items-center gap-1 text-sm font-semibold ${primary ? 'text-amber-300' : 'text-moss-700'}`}>
        立即体验
        <span className="transition-transform group-hover:translate-x-1">→</span>
      </div>
    </button>
  )
}

function ValueProp({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h3 className="font-display font-bold text-lg text-moss-700 mb-2">{title}</h3>
      <p className="text-sm text-moss-600 leading-relaxed">{description}</p>
    </div>
  )
}
