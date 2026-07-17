import { View, Text, Button, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { authApi, personaApi, setToken, getToken } from '@shared/api/client'
import type { User, Persona } from '@shared/types'
import './index.scss'

export default function Profile() {
  const [user, setUser] = useState<User | null>(null)
  const [personas, setPersonas] = useState<Persona[]>([])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)

  useEffect(() => {
    if (getToken()) {
      loadUser()
    }
  }, [])

  const loadUser = async () => {
    try {
      const meRes = await authApi.me()
      setUser(meRes.user)
      const psRes = await personaApi.list()
      setPersonas(psRes.personas)
    } catch (e) {
      console.error('加载用户信息失败', e)
      setToken(null)
    }
  }

  const handleSubmit = async () => {
    if (!email || !password) {
      Taro.showToast({ title: '请输入邮箱和密码', icon: 'none' })
      return
    }
    try {
      const api = isLogin ? authApi.login : authApi.register
      const res = await api({ email, password })
      setToken(res.token)
      setUser(res.user)
      Taro.showToast({ title: isLogin ? '登录成功' : '注册成功', icon: 'success' })
      loadUser()
    } catch (e: any) {
      Taro.showToast({ title: e.message || '操作失败', icon: 'none' })
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    setEmail('')
    setPassword('')
    Taro.showToast({ title: '已退出', icon: 'success' })
  }

  const goPersona = () => Taro.navigateTo({ url: '/pages/persona/index' })

  // 未登录
  if (!user) {
    return (
      <View className='page-profile'>
        <View className='auth-section'>
          <View className='auth-header'>
            <Text className='auth-title'>知食</Text>
            <Text className='auth-subtitle'>「吃」掉慢病，让每一口都被懂</Text>
          </View>

          <View className='auth-tabs'>
            <Text
              className={`tab ${isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(true)}
            >登录</Text>
            <Text
              className={`tab ${!isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(false)}
            >注册</Text>
          </View>

          <View className='auth-form'>
            <Input
              className='form-input'
              type='text'
              placeholder='邮箱'
              value={email}
              onInput={(e) => setEmail(e.detail.value)}
            />
            <Input
              className='form-input'
              password
              placeholder='密码'
              value={password}
              onInput={(e) => setPassword(e.detail.value)}
            />
            <Button className='btn-submit' onClick={handleSubmit}>
              {isLogin ? '登录' : '注册'}
            </Button>
          </View>
        </View>
      </View>
    )
  }

  // 已登录
  return (
    <View className='page-profile'>
      {/* 用户信息 */}
      <View className='user-header'>
        <View className='avatar-circle'>
          <Text className='avatar-text'>{user.nickname?.[0] || user.email[0].toUpperCase()}</Text>
        </View>
        <View className='user-info'>
          <Text className='user-name'>{user.nickname || '知食用户'}</Text>
          <Text className='user-email'>{user.email}</Text>
        </View>
        <Text className='logout-btn' onClick={logout}>退出</Text>
      </View>

      {/* Persona 列表 */}
      <View className='persona-section'>
        <View className='section-header'>
          <Text className='section-title'>慢病身份管理</Text>
          <Text className='add-btn' onClick={goPersona}>+ 添加</Text>
        </View>

        {personas.length === 0 ? (
          <View className='empty-persona'>
            <Text className='empty-text'>还没有慢病身份</Text>
            <Text className='empty-desc'>添加慢病身份，获得个性化建议</Text>
            <Button className='btn-add-persona' onClick={goPersona}>
              添加第一个身份
            </Button>
          </View>
        ) : (
          <View className='persona-list'>
            {personas.map(p => (
              <View key={p.id} className='persona-card card' onClick={goPersona}>
                <View className='persona-left'>
                  <Text className='persona-name'>{p.name}</Text>
                  <Text className='persona-condition'>
                    {p.condition === 'diabetes' ? '糖尿病' :
                     p.condition === 'hypertension' ? '高血压' :
                     p.condition === 'diabetes_hypertension' ? '糖尿病+高血压' : '健康'}
                  </Text>
                </View>
                <Text className='persona-relation'>
                  {p.relation === 'self' ? '本人' :
                   p.relation === 'parent' ? '父母' :
                   p.relation === 'spouse' ? '配偶' : '其他'}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* 功能入口 */}
      <View className='menu-section'>
        <View className='menu-item' onClick={() => Taro.navigateTo({ url: '/pages/legal/index?docType=user_agreement' })}>
          <Text className='menu-icon'>📋</Text>
          <Text className='menu-text'>用户协议</Text>
          <Text className='menu-arrow'>›</Text>
        </View>
        <View className='menu-item' onClick={() => Taro.navigateTo({ url: '/pages/legal/index?docType=privacy_policy' })}>
          <Text className='menu-icon'>🔒</Text>
          <Text className='menu-text'>隐私政策</Text>
          <Text className='menu-arrow'>›</Text>
        </View>
        <View className='menu-item' onClick={() => Taro.navigateTo({ url: '/pages/legal/index?docType=disclaimer' })}>
          <Text className='menu-icon'>⚠️</Text>
          <Text className='menu-text'>免责声明</Text>
          <Text className='menu-arrow'>›</Text>
        </View>
        <View className='menu-item' onClick={() => Taro.navigateTo({ url: '/pages/legal/index?docType=health_consent' })}>
          <Text className='menu-icon'>ℹ️</Text>
          <Text className='menu-text'>健康同意书</Text>
          <Text className='menu-arrow'>›</Text>
        </View>
      </View>
    </View>
  )
}
