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

interface PersonaForm {
  name: string
  relation: Relation
  condition: Condition
  bloodGlucoseTarget: { fasting: number; postprandial: number }
  bloodPressureTarget: { systolic: number; diastolic: number }
  medications: string[]
}

const DEFAULT_FORM: PersonaForm = {
  name: '',
  relation: 'self',
  condition: 'diabetes',
  bloodGlucoseTarget: { fasting: 7.0, postprandial: 10.0 },
  bloodPressureTarget: { systolic: 130, diastolic: 80 },
  medications: [],
}

// 慢病默认控制目标（切换 condition 时填充）
const CONDITION_DEFAULTS: Record<Condition, Partial<PersonaForm>> = {
  diabetes: {
    bloodGlucoseTarget: { fasting: 7.0, postprandial: 10.0 },
    bloodPressureTarget: { systolic: 130, diastolic: 80 },
  },
  hypertension: {
    bloodGlucoseTarget: { fasting: 6.1, postprandial: 7.8 },
    bloodPressureTarget: { systolic: 130, diastolic: 80 },
  },
  diabetes_hypertension: {
    bloodGlucoseTarget: { fasting: 7.0, postprandial: 10.0 },
    bloodPressureTarget: { systolic: 130, diastolic: 80 },
  },
  healthy: {
    bloodGlucoseTarget: { fasting: 6.1, postprandial: 7.8 },
    bloodPressureTarget: { systolic: 120, diastolic: 80 },
  },
}

const showGlucoseFields = (c: Condition) => c === 'diabetes' || c === 'diabetes_hypertension'
const showBpFields = (c: Condition) => c === 'hypertension' || c === 'diabetes_hypertension'

export default function PersonaPage() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<PersonaForm>(DEFAULT_FORM)
  const [medicationInput, setMedicationInput] = useState('')

  useEffect(() => {
    if (getToken()) load()
  }, [])

  const load = async () => {
    try {
      const res = await personaApi.list()
      setPersonas(res.personas)
    } catch (e) {
      console.error('加载失败', e)
    }
  }

  const openAdd = () => {
    setForm({ ...DEFAULT_FORM, ...CONDITION_DEFAULTS.diabetes })
    setMedicationInput('')
    setEditingId(null)
    setShowForm(true)
  }

  const openEdit = (p: Persona) => {
    setForm({
      name: p.name,
      relation: p.relation,
      condition: p.condition,
      bloodGlucoseTarget: p.bloodGlucoseTarget ?? { fasting: 7.0, postprandial: 10.0 },
      bloodPressureTarget: p.bloodPressureTarget ?? { systolic: 130, diastolic: 80 },
      medications: p.medications ?? [],
    })
    setMedicationInput('')
    setEditingId(p.id)
    setShowForm(true)
  }

  // 切换 condition 时同步默认目标值
  const onConditionChange = (c: Condition) => {
    const defaults = CONDITION_DEFAULTS[c] || {}
    setForm({
      ...form,
      condition: c,
      bloodGlucoseTarget: defaults.bloodGlucoseTarget ?? form.bloodGlucoseTarget,
      bloodPressureTarget: defaults.bloodPressureTarget ?? form.bloodPressureTarget,
    })
  }

  // 添加药品
  const addMedication = () => {
    const v = medicationInput.trim()
    if (!v) return
    if (form.medications.includes(v)) {
      setMedicationInput('')
      return
    }
    setForm({ ...form, medications: [...form.medications, v] })
    setMedicationInput('')
  }

  const removeMedication = (m: string) => {
    setForm({ ...form, medications: form.medications.filter(x => x !== m) })
  }

  const submit = async () => {
    if (!form.name.trim()) return
    const payload = {
      name: form.name.trim(),
      relation: form.relation,
      condition: form.condition,
      bloodGlucoseTarget: showGlucoseFields(form.condition) ? form.bloodGlucoseTarget : undefined,
      bloodPressureTarget: showBpFields(form.condition) ? form.bloodPressureTarget : undefined,
      medications: form.medications,
    }
    try {
      if (editingId) {
        await personaApi.update(editingId, payload)
      } else {
        await personaApi.create(payload)
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
                  {p.bloodGlucoseTarget && ` · 目标 ${p.bloodGlucoseTarget.fasting}-${p.bloodGlucoseTarget.postprandial}`}
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
                const idx = Number(e.detail.value)
                setForm({ ...form, relation: RELATIONS[idx].value })
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
                const idx = Number(e.detail.value)
                onConditionChange(CONDITIONS[idx].value)
              }}
            >
              <View className='picker-value'>
                {CONDITIONS.find(c => c.value === form.condition)?.label}
                <Text className='picker-arrow'>›</Text>
              </View>
            </Picker>
          </View>

          {/* 血糖目标（仅糖尿病相关 condition 显示） */}
          {showGlucoseFields(form.condition) && (
            <View className='form-subsection'>
              <Text className='subsection-title'>血糖目标 (mmol/L)</Text>
              <View className='form-row'>
                <View className='form-item form-item-half'>
                  <Text className='form-label'>空腹</Text>
                  <Input
                    className='form-input'
                    type='digit'
                    value={String(form.bloodGlucoseTarget.fasting)}
                    onInput={(e) => {
                      const v = parseFloat(e.detail.value)
                      if (!isNaN(v)) {
                        setForm({
                          ...form,
                          bloodGlucoseTarget: { ...form.bloodGlucoseTarget, fasting: v },
                        })
                      }
                    }}
                  />
                </View>
                <View className='form-item form-item-half'>
                  <Text className='form-label'>餐后2小时</Text>
                  <Input
                    className='form-input'
                    type='digit'
                    value={String(form.bloodGlucoseTarget.postprandial)}
                    onInput={(e) => {
                      const v = parseFloat(e.detail.value)
                      if (!isNaN(v)) {
                        setForm({
                          ...form,
                          bloodGlucoseTarget: { ...form.bloodGlucoseTarget, postprandial: v },
                        })
                      }
                    }}
                  />
                </View>
              </View>
            </View>
          )}

          {/* 血压目标（仅高血压相关 condition 显示） */}
          {showBpFields(form.condition) && (
            <View className='form-subsection'>
              <Text className='subsection-title'>血压目标 (mmHg)</Text>
              <View className='form-row'>
                <View className='form-item form-item-half'>
                  <Text className='form-label'>收缩压</Text>
                  <Input
                    className='form-input'
                    type='digit'
                    value={String(form.bloodPressureTarget.systolic)}
                    onInput={(e) => {
                      const v = parseFloat(e.detail.value)
                      if (!isNaN(v)) {
                        setForm({
                          ...form,
                          bloodPressureTarget: { ...form.bloodPressureTarget, systolic: v },
                        })
                      }
                    }}
                  />
                </View>
                <View className='form-item form-item-half'>
                  <Text className='form-label'>舒张压</Text>
                  <Input
                    className='form-input'
                    type='digit'
                    value={String(form.bloodPressureTarget.diastolic)}
                    onInput={(e) => {
                      const v = parseFloat(e.detail.value)
                      if (!isNaN(v)) {
                        setForm({
                          ...form,
                          bloodPressureTarget: { ...form.bloodPressureTarget, diastolic: v },
                        })
                      }
                    }}
                  />
                </View>
              </View>
            </View>
          )}

          {/* 用药列表 */}
          <View className='form-subsection'>
            <Text className='subsection-title'>当前用药</Text>
            <View className='form-row'>
              <Input
                className='form-input form-input-grow'
                placeholder='如：二甲双胍 500mg bid'
                value={medicationInput}
                onInput={(e) => setMedicationInput(e.detail.value)}
                onConfirm={addMedication}
              />
              <Button className='btn-add-tag' onClick={addMedication}>添加</Button>
            </View>
            {form.medications.length > 0 && (
              <View className='tag-list'>
                {form.medications.map((m, i) => (
                  <View key={i} className='tag-item'>
                    <Text className='tag-text'>{m}</Text>
                    <Text className='tag-remove' onClick={() => removeMedication(m)}>×</Text>
                  </View>
                ))}
              </View>
            )}
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
