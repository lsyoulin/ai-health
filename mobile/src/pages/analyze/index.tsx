import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { optimizeApi, foodApi } from '@shared/api/client'
import type { Food, OptimizationResult, Disclaimer } from '@shared/types'
import './index.scss'

interface SelectedFood {
  food: Food
  amountG: number
}

export default function Analyze() {
  const [foods, setFoods] = useState<Food[]>([])
  const [selectedFoods, setSelectedFoods] = useState<SelectedFood[]>([])
  const [result, setResult] = useState<OptimizationResult | null>(null)
  const [disclaimer, setDisclaimer] = useState<Disclaimer | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string>('')

  // 加载后端食物库，筛选主食类前 8 种
  useEffect(() => {
    loadFoods()
  }, [])

  const loadFoods = async () => {
    try {
      const res = await foodApi.list({ limit: 50 })
      const staples = (res.foods || []).filter(f => f.category === '主食').slice(0, 8)
      setFoods(staples)
      console.log('[analyze] 加载主食列表', staples.length)
    } catch (e) {
      console.error('[analyze] 加载食物库失败', e)
      setErrorMsg('食物库加载失败，请稍后重试')
    }
  }

  // 拍照（暂保持 mock，未接 AI 视觉识别）
  const takePhoto = async () => {
    try {
      const res = await Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['camera', 'album'],
      })
      if (res.tempFilePaths.length > 0) {
        Taro.showToast({ title: '识别中...', icon: 'loading', duration: 2000 })
        // TODO: 接入后端 AI 视觉识别接口
        setTimeout(() => {
          Taro.showToast({ title: '请手动选择食物', icon: 'none' })
        }, 2000)
      }
    } catch (e) {
      console.error('[analyze] 选择图片失败', e)
    }
  }

  // 切换选择某个主食
  const toggleFood = (food: Food) => {
    setSelectedFoods(prev => {
      const exists = prev.find(item => item.food.id === food.id)
      if (exists) {
        return prev.filter(item => item.food.id !== food.id)
      }
      return [...prev, { food, amountG: food.defaultPortionG }]
    })
    // 切换食物时清空上次预测结果
    setResult(null)
    setDisclaimer(null)
    setErrorMsg('')
  }

  // AI 健康预测：调用后端 /optimize
  const analyze = async () => {
    if (selectedFoods.length === 0) {
      Taro.showToast({ title: '请先选择食物', icon: 'none' })
      return
    }
    setAnalyzing(true)
    setErrorMsg('')
    setResult(null)
    setDisclaimer(null)

    try {
      const items = selectedFoods.map(item => ({
        foodId: item.food.id,
        amountG: item.amountG,
      }))
      console.log('[analyze] 调用 optimize 接口', items)
      // 不带 personaId，后端使用默认 demo persona
      const res = await optimizeApi.optimize({ items })
      setResult(res.result)
      setDisclaimer(res.disclaimer || null)
      console.log('[analyze] 预测完成', res.result.prediction)
    } catch (e: any) {
      console.error('[analyze] AI 分析失败', e)
      setErrorMsg('AI 分析暂不可用，请稍后重试')
    } finally {
      setAnalyzing(false)
    }
  }

  // 跳转完整免责声明页
  const goDisclaimer = () => {
    Taro.navigateTo({ url: '/pages/legal/index?docType=disclaimer' })
  }

  const riskColor = result?.prediction.riskLevel === 'danger' ? '#F44336' :
                    result?.prediction.riskLevel === 'warning' ? '#FF9800' : '#4CAF50'
  const riskText = result?.prediction.riskLevel === 'danger' ? '超标' :
                   result?.prediction.riskLevel === 'warning' ? '临界' : '安全'

  return (
    <View className='page-analyze'>
      <View className='page-header'>
        <Text className='page-title'>拍照分析</Text>
        <Text className='page-desc'>拍照或选择食物，AI预测健康影响</Text>
      </View>

      {/* 拍照区 */}
      <View className='photo-section'>
        <Button className='btn-photo' onClick={takePhoto}>
          📷 拍照识别
        </Button>
        <Button className='btn-manual' onClick={() => Taro.showToast({ title: '请从下方选择主食', icon: 'none' })}>
          🔍 手动选择
        </Button>
      </View>

      {/* 食物选择区（主食类前 8 种） */}
      {foods.length > 0 && (
        <View className='food-picker card'>
          <Text className='section-title'>选择主食</Text>
          <View className='food-grid'>
            {foods.map(food => {
              const selected = selectedFoods.some(item => item.food.id === food.id)
              return (
                <View
                  key={food.id}
                  className={`food-chip ${selected ? 'selected' : ''}`}
                  onClick={() => toggleFood(food)}
                >
                  <Text className='chip-name'>{food.name}</Text>
                  <Text className='chip-amount'>{food.defaultPortionG}g</Text>
                </View>
              )
            })}
          </View>
        </View>
      )}

      {/* 已选食物 */}
      {selectedFoods.length > 0 && (
        <View className='food-list card'>
          <Text className='section-title'>已选食物</Text>
          {selectedFoods.map((item, idx) => (
            <View key={idx} className='food-item'>
              <Text className='food-name'>{item.food.name}</Text>
              <Text className='food-amount'>{item.amountG}g</Text>
            </View>
          ))}
        </View>
      )}

      {/* 分析按钮 */}
      {selectedFoods.length > 0 && (
        <Button
          className='btn-analyze'
          loading={analyzing}
          disabled={analyzing}
          onClick={analyze}
        >
          {analyzing ? 'AI 分析中...' : '🔮 预测健康影响'}
        </Button>
      )}

      {/* 加载中提示 */}
      {analyzing && (
        <View className='loading-tip'>
          <Text className='loading-text'>正在分析营养成分与血糖影响...</Text>
        </View>
      )}

      {/* 错误降级提示 */}
      {errorMsg && (
        <View className='result-section'>
          <View className='result-card card'>
            <Text className='error-text'>{errorMsg}</Text>
          </View>
        </View>
      )}

      {/* 预测结果 */}
      {result && (
        <View className='result-section'>
          <View className='result-card card'>
            <Text className='result-title'>预测结果</Text>

            {/* 血糖预测环 */}
            <View className='glucose-ring' style={{ borderColor: riskColor }}>
              <Text className='glucose-value' style={{ color: riskColor }}>
                {result.prediction.predictedGlucose.toFixed(1)}
              </Text>
              <Text className='glucose-unit'>mmol/L</Text>
              <Text className='risk-badge' style={{ color: riskColor, borderColor: riskColor }}>
                {riskText}
              </Text>
            </View>

            {/* 营养汇总 */}
            <View className='nutrition-row'>
              <View className='nutrition-item'>
                <Text className='nutrition-value'>{result.prediction.totalNutrition.calories.toFixed(0)}</Text>
                <Text className='nutrition-label'>热量(kcal)</Text>
              </View>
              <View className='nutrition-item'>
                <Text className='nutrition-value'>{result.prediction.totalNutrition.carbs.toFixed(1)}g</Text>
                <Text className='nutrition-label'>碳水</Text>
              </View>
              <View className='nutrition-item'>
                <Text className='nutrition-value'>{result.prediction.totalNutrition.protein.toFixed(1)}g</Text>
                <Text className='nutrition-label'>蛋白质</Text>
              </View>
              <View className='nutrition-item'>
                <Text className='nutrition-value'>{result.prediction.totalNutrition.sodium.toFixed(0)}mg</Text>
                <Text className='nutrition-label'>钠</Text>
              </View>
            </View>

            {/* AI 建议 */}
            {result.suggestions && result.suggestions.length > 0 && (
              <View className='advice-box'>
                <Text className='advice-label'>💡 AI 建议</Text>
                {result.suggestions.map((s, i) => (
                  <Text key={i} className='advice-text'>· {s}</Text>
                ))}
              </View>
            )}

            {/* 简化版免责声明 */}
            {disclaimer && (
              <View className='disclaimer-box'>
                <Text className='disclaimer-text'>
                  {disclaimer.text}
                </Text>
                <Text className='disclaimer-link' onClick={goDisclaimer}>
                  查看完整声明 ›
                </Text>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  )
}
