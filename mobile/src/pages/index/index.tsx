import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { authApi, personaApi, getToken } from '@shared/api/client'
import type { Persona } from '@shared/types'
import './index.scss'

export default function Index() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [currentPersona, setCurrentPersona] = useState<Persona | null>(null)

  useEffect(() => {
    if (!getToken()) {
      Taro.navigateTo({ url: '/pages/profile/index' })
      return
    }
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const res = await personaApi.list()
      setPersonas(res.personas)
      if (res.personas.length > 0 && !currentPersona) {
        setCurrentPersona(res.personas[0])
      }
    } catch (e) {
      console.error('加载数据失败', e)
    }
  }

  const goAnalyze = () => Taro.switchTab({ url: '/pages/analyze/index' })
  const goRecords = () => Taro.switchTab({ url: '/pages/records/index' })
  const goCoach = () => Taro.navigateTo({ url: '/pages/coach/index' })
  const goPersona = () => Taro.navigateTo({ url: '/pages/persona/index' })

  return (
    <View className='page-index'>
      {/* 品牌头部 */}
      <View className='header'>
        <Text className='brand'>知食</Text>
        <Text className='slogan'>「吃」掉慢病，让每一口都被懂</Text>
      </View>

      {/* Persona 切换 */}
      <View className='persona-bar' onClick={goPersona}>
        {currentPersona ? (
          <View className='persona-info'>
            <Text className='persona-name'>{currentPersona.name}</Text>
            <Text className='persona-condition'>
              {currentPersona.condition === 'diabetes' ? '糖尿病' :
               currentPersona.condition === 'hypertension' ? '高血压' :
               currentPersona.condition === 'diabetes_hypertension' ? '糖尿病+高血压' : '健康'}
            </Text>
          </View>
        ) : (
          <Text className='persona-empty'>点击设置慢病身份</Text>
        )}
        <Text className='arrow'>›</Text>
      </View>

      {/* 今日概览 */}
      <View className='overview card'>
        <Text className='section-title'>今日健康</Text>
        <View className='stats-row'>
          <View className='stat-item'>
            <Text className='stat-value'>--</Text>
            <Text className='stat-label'>预测血糖</Text>
          </View>
          <View className='stat-divider' />
          <View className='stat-item'>
            <Text className='stat-value'>0</Text>
            <Text className='stat-label'>饮食记录</Text>
          </View>
          <View className='stat-divider' />
          <View className='stat-item'>
            <Text className='stat-value'>--</Text>
            <Text className='stat-label'>健康评分</Text>
          </View>
        </View>
      </View>

      {/* 快速入口 */}
      <View className='actions'>
        <View className='action-card card' onClick={goAnalyze}>
          <Text className='action-icon'>📷</Text>
          <Text className='action-title'>拍照分析</Text>
          <Text className='action-desc'>AI预测餐后血糖</Text>
        </View>
        <View className='action-card card' onClick={goRecords}>
          <Text className='action-icon'>📝</Text>
          <Text className='action-title'>饮食记录</Text>
          <Text className='action-desc'>追踪每日饮食</Text>
        </View>
        <View className='action-card card' onClick={goCoach}>
          <Text className='action-icon'>💬</Text>
          <Text className='action-title'>AI对话</Text>
          <Text className='action-desc'>个性化饮食建议</Text>
        </View>
        <View className='action-card card' onClick={goPersona}>
          <Text className='action-icon'>👥</Text>
          <Text className='action-title'>慢病管理</Text>
          <Text className='action-desc'>管理家人健康</Text>
        </View>
      </View>

      {/* 今日知识卡 */}
      <View className='knowledge-section'>
        <Text className='section-title'>今日知识</Text>
        <View className='knowledge-card card'>
          <Text className='knowledge-title'>糖尿病饮食三原则</Text>
          <Text className='knowledge-content'>
            1. 控制总量：每餐主食不超过一个拳头大小
          </Text>
          <Text className='knowledge-content'>
            2. 调整顺序：先菜后肉最后主食，血糖更平稳
          </Text>
          <Text className='knowledge-content'>
            3. 合理搭配：每餐有菜有肉有主食
          </Text>
        </View>
      </View>
    </View>
  )
}
