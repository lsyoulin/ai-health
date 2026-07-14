import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { recordApi, getToken } from '@shared/api/client'
import type { FoodRecord, MealType } from '@shared/types'
import './index.scss'

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐',
}

export default function Records() {
  const [records, setRecords] = useState<FoodRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!getToken()) return
    loadRecords()
  }, [])

  const loadRecords = async () => {
    try {
      const data = await recordApi.list()
      setRecords(data)
    } catch (e) {
      console.error('加载记录失败', e)
    } finally {
      setLoading(false)
    }
  }

  // 按餐次分组
  const grouped = records.reduce((acc, r) => {
    if (!acc[r.mealType]) acc[r.mealType] = []
    acc[r.mealType].push(r)
    return acc
  }, {} as Record<string, FoodRecord[]>)

  const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']

  const goAnalyze = () => Taro.switchTab({ url: '/pages/analyze/index' })

  return (
    <View className='page-records'>
      <View className='page-header'>
        <Text className='page-title'>饮食记录</Text>
        <Text className='page-desc'>
          {records.length > 0 ? `今日 ${records.length} 条记录` : '暂无记录'}
        </Text>
      </View>

      {loading ? (
        <View className='empty'>
          <Text className='empty-text'>加载中...</Text>
        </View>
      ) : records.length === 0 ? (
        <View className='empty'>
          <Text className='empty-icon'>📝</Text>
          <Text className='empty-text'>还没有饮食记录</Text>
          <Button className='btn-add' onClick={goAnalyze}>
            添加第一条记录
          </Button>
        </View>
      ) : (
        <View className='record-list'>
          {mealTypes.map(mealType => {
            const mealRecords = grouped[mealType]
            if (!mealRecords || mealRecords.length === 0) return null
            return (
              <View key={mealType} className='meal-group'>
                <Text className='meal-title'>{MEAL_LABELS[mealType]}</Text>
                {mealRecords.map(record => (
                  <View key={record.id} className='record-card card'>
                    <View className='record-header'>
                      <Text className='record-time'>
                        {new Date(record.mealTime).toLocaleTimeString('zh-CN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                      {record.predictedGlucose && (
                        <Text className='record-glucose'>
                          预测血糖 {record.predictedGlucose} mmol/L
                        </Text>
                      )}
                    </View>
                    <View className='record-items'>
                      {record.items.map((item, idx) => (
                        <Text key={idx} className='record-item'>
                          {item.food?.name || '未知食物'} {item.amountG}g
                        </Text>
                      ))}
                    </View>
                    {record.actualGlucose && (
                      <View className='actual-glucose'>
                        <Text className='actual-label'>实际血糖</Text>
                        <Text className='actual-value'>{record.actualGlucose} mmol/L</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )
          })}
        </View>
      )}
    </View>
  )
}
