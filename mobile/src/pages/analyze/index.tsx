import { View, Text, Button, Input, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import type { Food, HealthPrediction } from '@shared/types'
import './index.scss'

interface SelectedFood {
  food: Food
  amountG: number
}

export default function Analyze() {
  const [selectedFoods, setSelectedFoods] = useState<SelectedFood[]>([])
  const [prediction, setPrediction] = useState<HealthPrediction | null>(null)
  const [analyzing, setAnalyzing] = useState(false)

  // 拍照
  const takePhoto = async () => {
    try {
      const res = await Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['camera', 'album'],
      })
      if (res.tempFilePaths.length > 0) {
        Taro.showToast({ title: '识别中...', icon: 'loading', duration: 2000 })
        // TODO: 调用后端 AI 识别接口
        // 暂时模拟
        setTimeout(() => {
          Taro.showToast({ title: '请选择食物', icon: 'none' })
        }, 2000)
      }
    } catch (e) {
      console.error('选择图片失败', e)
    }
  }

  // 手动添加食物
  const addFood = () => {
    Taro.showToast({ title: '搜索食物功能开发中', icon: 'none' })
  }

  // 健康预测
  const analyze = async () => {
    if (selectedFoods.length === 0) {
      Taro.showToast({ title: '请先添加食物', icon: 'none' })
      return
    }
    setAnalyzing(true)
    // TODO: 调用后端预测接口
    setTimeout(() => {
      setPrediction({
        predictedGlucose: 8.5,
        predictedGlucoseRange: { min: 7.2, max: 9.8 },
        riskLevel: 'warning',
        advice: '建议减少主食摄入，增加蔬菜比例',
        carbsTotal: 75,
        energyTotal: 520,
        sodiumTotal: 1200,
      })
      setAnalyzing(false)
    }, 1500)
  }

  const riskColor = prediction?.riskLevel === 'danger' ? '#F44336' :
                    prediction?.riskLevel === 'warning' ? '#FF9800' : '#4CAF50'
  const riskText = prediction?.riskLevel === 'danger' ? '超标' :
                   prediction?.riskLevel === 'warning' ? '临界' : '安全'

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
        <Button className='btn-manual' onClick={addFood}>
          🔍 手动选择
        </Button>
      </View>

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
          onClick={analyze}
        >
          {analyzing ? 'AI分析中...' : '🔮 预测健康影响'}
        </Button>
      )}

      {/* 预测结果 */}
      {prediction && (
        <View className='result-section'>
          <View className='result-card card'>
            <Text className='result-title'>预测结果</Text>

            {/* 血糖预测环 */}
            <View className='glucose-ring' style={{ borderColor: riskColor }}>
              <Text className='glucose-value' style={{ color: riskColor }}>
                {prediction.predictedGlucose}
              </Text>
              <Text className='glucose-unit'>mmol/L</Text>
              <Text className='risk-badge' style={{ color: riskColor, borderColor: riskColor }}>
                {riskText}
              </Text>
            </View>

            {/* 范围 */}
            <View className='range-row'>
              <Text className='range-label'>预测范围</Text>
              <Text className='range-value'>
                {prediction.predictedGlucoseRange.min} ~ {prediction.predictedGlucoseRange.max} mmol/L
              </Text>
            </View>

            {/* 营养汇总 */}
            <View className='nutrition-row'>
              <View className='nutrition-item'>
                <Text className='nutrition-value'>{prediction.carbsTotal}g</Text>
                <Text className='nutrition-label'>碳水</Text>
              </View>
              <View className='nutrition-item'>
                <Text className='nutrition-value'>{prediction.energyTotal}kcal</Text>
                <Text className='nutrition-label'>热量</Text>
              </View>
              <View className='nutrition-item'>
                <Text className='nutrition-value'>{prediction.sodiumTotal}mg</Text>
                <Text className='nutrition-label'>钠</Text>
              </View>
            </View>

            {/* 建议 */}
            <View className='advice-box'>
              <Text className='advice-label'>💡 AI建议</Text>
              <Text className='advice-text'>{prediction.advice}</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
