import { View, Text, Button, Input, Picker } from '@tarojs/components'
import { useEffect, useState } from 'react'
import { personaApi, getToken } from '@shared/api/client'
import type { Persona, Condition, Relation } from '@shared/types'
import './index.scss'

const CONDITIONS: { value: Condition; label: string }[] = [
  { value: 'diabetes', label: '糖尿病' },
  { value: 'hypertension', label: '高血压' },
  { value: 'diabetes_hypertension', label: '糖尿病+高血压' },
  { value: 'healthy', label: '健康' },
]

const RELATIONS: { value: Relation; label: string }[] = [
  { value: 'self', label: '本人' },
  { value: 'parent', label: '父母' },
  { value: 'spouse', label: '配偶' },
  { value: 'other', label: '其他' },
]

export default function PersonaPage() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    relation: 'self' as Relation,
    condition: 'diabetes' as Condition,
  })

  useEffect(() => {
    if (getToken()) load()
  }, [])

  const load = async () => {
    try {
      const data = await personaApi.list()
      setPersonas(data)
    } catch (e) {
      console.error('加载失败', e)
    }
  }

  const openAdd = () => {
    setForm({ name: '', relation: 'self', condition: 'diabetes' })
    setEditingId(null)
    setShowForm(true)
  }

  const openEdit = (p: Persona) => {
    setForm({ name: p.name, relation: p.relation, condition: p.condition })
    setEditingId(p.id)
    setShowForm(true)
  }

  const submit = async () => {
    if (!form.name.trim()) {
      return
    }
    try {
      if (editingId) {
        await personaApi.update(editingId, form)
      } else {
        await personaApi.create(form)
      }
      setShowForm(false)
      load()
    } catch (e) {
      console.error('保存失败', e)
    }
  }

  const remove = async (id: string) => {
    try {
      await personaApi.delete(id)
      load()
    } catch (e) {
      console.error('删除失败', e)
    }
  }

  return (
    <View className='page-persona'>
      <View className='page-header'>
        <Text className='page-title'>慢病身份管理</Text>
        <Text className='page-desc'>为家人创建不同的健康身份</Text>
      </View>

      {personas.length > 0 && (
        <View className='persona-list'>
          {personas.map(p => (
            <View key={p.id} className='persona-card card'>
              <View className='persona-info' onClick={() => openEdit(p)}>
                <View className='persona-header'>
                  <Text className='persona-name'>{p.name}</Text>
                  <Text className={`condition-tag condition-${p.condition}`}>
                    {CONDITIONS.find(c => c.value === p.condition)?.label}
                  </Text>
                </View>
                <Text className='persona-relation'>
                  {RELATIONS.find(r => r.value === p.relation)?.label}
                  {p.medications.length > 0 && ` · 用药 ${p.medications.length} 种`}
                </Text>
              </View>
              <Text className='delete-btn' onClick={() => remove(p.id)}>删除</Text>
            </View>
          ))}
        </View>
      )}

      {!showForm && (
        <Button className='btn-add' onClick={openAdd}>
          + 添加慢病身份
        </Button>
      )}

      {showForm && (
        <View className='form-card card'>
          <Text className='form-title'>{editingId ? '编辑身份' : '新增身份'}</Text>

          <View className='form-item'>
            <Text className='form-label'>名称</Text>
            <Input
              className='form-input'
              placeholder='如：我的糖尿病、父亲'
              value={form.name}
              onInput={(e) => setForm({ ...form, name: e.detail.value })}
            />
          </View>

          <View className='form-item'>
            <Text className='form-label'>关系</Text>
            <Picker
              mode='selector'
              range={RELATIONS.map(r => r.label)}
              onChange={(e) => {
                setForm({
                  ...form,
                  relation: RELATIONS[e.detail.value].value,
                })
              }}
            >
              <View className='picker-value'>
                {RELATIONS.find(r => r.value === form.relation)?.label}
                <Text className='picker-arrow'>›</Text>
              </View>
            </Picker>
          </View>

          <View className='form-item'>
            <Text className='form-label'>慢病类型</Text>
            <Picker
              mode='selector'
              range={CONDITIONS.map(c => c.label)}
              onChange={(e) => {
                setForm({
                  ...form,
                  condition: CONDITIONS[e.detail.value].value,
                })
              }}
            >
              <View className='picker-value'>
                {CONDITIONS.find(c => c.value === form.condition)?.label}
                <Text className='picker-arrow'>›</Text>
              </View>
            </Picker>
          </View>

          <View className='form-actions'>
            <Button className='btn-cancel' onClick={() => setShowForm(false)}>
              取消
            </Button>
            <Button className='btn-save' onClick={submit}>
              保存
            </Button>
          </View>
        </View>
      )}
    </View>
  )
}
