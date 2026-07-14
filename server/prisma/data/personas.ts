import type { PersonaSeed } from './types'

// ============ 4 种默认 Persona 模板 ============
// 用于 seed 一个 demo user，并为其创建 4 种参考 Persona
// 实际业务中 Persona 是 user-bound，每个用户可以创建自己的 Persona

export const defaultPersonas: PersonaSeed[] = [
  // 1. 糖尿病 Persona（2 型轻度）
  {
    name: '我的糖尿病档案',
    relation: 'self',
    condition: 'diabetes',
    stage: 'type2_mild',
    bloodGlucoseTarget: { fasting: 7, postprandial: 10 },
    bloodPressureTarget: { systolic: 130, diastolic: 80 },
    medications: ['二甲双胍 500mg bid'],
  },
  // 2. 高血压 Persona
  {
    name: '我的高血压档案',
    relation: 'self',
    condition: 'hypertension',
    stage: 'stage1',
    bloodGlucoseTarget: { fasting: 6.1, postprandial: 7.8 },
    bloodPressureTarget: { systolic: 135, diastolic: 85 },
    medications: ['氨氯地平 5mg qd'],
  },
  // 3. 糖尿病 + 高血压 Persona（并发症）
  {
    name: '我的糖尿病+高血压档案',
    relation: 'self',
    condition: 'diabetes_hypertension',
    stage: 'type2_mild_stage1',
    bloodGlucoseTarget: { fasting: 7, postprandial: 10 },
    bloodPressureTarget: { systolic: 130, diastolic: 80 },
    medications: ['二甲双胍 500mg bid', '氨氯地平 5mg qd'],
  },
  // 4. 健康人 Persona（对照参考）
  {
    name: '健康人参考档案',
    relation: 'self',
    condition: 'healthy',
    stage: undefined,
    bloodGlucoseTarget: { fasting: 6.1, postprandial: 7.8 },
    bloodPressureTarget: { systolic: 120, diastolic: 80 },
    medications: [],
  },
]

// ============ 为父母分析模式预置的 Persona 模板 ============
// 评委体验 Demo 时可基于这些模板快速创建父母档案
export const parentPersonaTemplates: PersonaSeed[] = [
  {
    name: '父亲（2 型糖尿病+高血压）',
    relation: 'parent',
    condition: 'diabetes_hypertension',
    stage: 'type2_mild_stage1',
    bloodGlucoseTarget: { fasting: 7, postprandial: 10 },
    bloodPressureTarget: { systolic: 140, diastolic: 90 },
    medications: ['二甲双胍 500mg bid', '缬沙坦 80mg qd'],
  },
  {
    name: '母亲（2 型糖尿病）',
    relation: 'parent',
    condition: 'diabetes',
    stage: 'type2_mild',
    bloodGlucoseTarget: { fasting: 7, postprandial: 10 },
    bloodPressureTarget: { systolic: 130, diastolic: 80 },
    medications: ['二甲双胍 500mg bid'],
  },
  {
    name: '父亲（高血压）',
    relation: 'parent',
    condition: 'hypertension',
    stage: 'stage1',
    bloodGlucoseTarget: { fasting: 6.1, postprandial: 7.8 },
    bloodPressureTarget: { systolic: 140, diastolic: 90 },
    medications: ['氨氯地平 5mg qd'],
  },
]
