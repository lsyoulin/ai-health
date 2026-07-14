/**
 * 知食 · Prisma Seed 脚本
 *
 * 用法：npm run prisma:seed
 *
 * 数据内容：
 * - 食物库：161 种中国常见食物（9 大分类）
 * - 4 种默认 Persona 模板（绑定到 demo user）
 * - 50 张慢病知识卡（diabetes 20 + hypertension 18 + general 12）
 *
 * 数据来源：
 * - 《中国食物成分表》标准版第 6 版
 * - 《中国 2 型糖尿病防治指南》2020 版
 * - 《中国高血压防治指南》2024 版
 * - 《中国居民膳食指南》2022 版
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

import {
  stapleFoods,
  vegetableFoods,
  fruitFoods,
} from './data/foods-staple-vegetable-fruit.js'
import {
  meatFoods,
  eggFoods,
  dairyFoods,
  beanFoods,
  nutFoods,
  condimentFoods,
  mixedFoods,
} from './data/foods-protein-other.js'
import { defaultPersonas } from './data/personas.js'
import { knowledgeCards } from './data/knowledge-cards.js'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 开始 seed 知食数据库...\n')

  // ========== 1. 清空旧数据（保证幂等） ==========
  console.log('🧹 清空旧数据...')
  await prisma.foodRecordItem.deleteMany()
  await prisma.foodRecord.deleteMany()
  await prisma.knowledgeCard.deleteMany()
  await prisma.persona.deleteMany()
  await prisma.food.deleteMany()
  // demo user 单独处理
  const demoEmail = 'demo@zhishi.com'
  const existingDemo = await prisma.user.findUnique({ where: { email: demoEmail } })
  if (existingDemo) {
    await prisma.user.delete({ where: { id: existingDemo.id } })
  }
  console.log('   ✓ 旧数据已清空\n')

  // ========== 2. 插入食物库 ==========
  console.log('🍚 插入食物库...')

  const allFoods = [
    ...stapleFoods,
    ...vegetableFoods,
    ...fruitFoods,
    ...meatFoods,
    ...eggFoods,
    ...dairyFoods,
    ...beanFoods,
    ...nutFoods,
    ...condimentFoods,
    ...mixedFoods,
  ]

  // 按分类统计
  const categoryCount: Record<string, number> = {}
  for (const food of allFoods) {
    categoryCount[food.category] = (categoryCount[food.category] || 0) + 1
  }

  // 批量插入
  await prisma.food.createMany({
    data: allFoods.map((f) => ({
      name: f.name,
      category: f.category,
      subcategory: f.subcategory,
      energyKcal: f.energyKcal,
      carbsG: f.carbsG,
      proteinG: f.proteinG,
      fatG: f.fatG,
      fiberG: f.fiberG ?? null,
      sodiumMg: f.sodiumMg ?? null,
      potassiumMg: f.potassiumMg ?? null,
      gi: f.gi ?? null,
      gl: f.gl ?? null,
      defaultPortionG: f.defaultPortionG ?? 100,
      source: f.source ?? null,
    })),
  })

  console.log(`   ✓ 共插入 ${allFoods.length} 种食物`)
  for (const [cat, n] of Object.entries(categoryCount)) {
    console.log(`     - ${cat}: ${n} 种`)
  }
  console.log()

  // ========== 3. 创建 demo user + Persona ==========
  console.log('👤 创建 demo user 与 4 种 Persona...')

  const passwordHash = await bcrypt.hash('demo123456', 10)
  const demoUser = await prisma.user.create({
    data: {
      email: demoEmail,
      passwordHash,
      nickname: '演示用户',
      birthYear: 1965,
      gender: 'male',
    },
  })

  for (const p of defaultPersonas) {
    await prisma.persona.create({
      data: {
        userId: demoUser.id,
        name: p.name,
        relation: p.relation,
        condition: p.condition,
        stage: p.stage ?? null,
        bloodGlucoseTarget: p.bloodGlucoseTarget ?? undefined,
        bloodPressureTarget: p.bloodPressureTarget ?? undefined,
        medications: p.medications,
      },
    })
  }
  console.log(`   ✓ demo user: ${demoEmail} (密码: demo123456)`)
  console.log(`   ✓ ${defaultPersonas.length} 种 Persona 已创建`)
  console.log()

  // ========== 4. 插入知识卡 ==========
  console.log('📚 插入慢病知识卡...')

  await prisma.knowledgeCard.createMany({
    data: knowledgeCards.map((k) => ({
      title: k.title,
      category: k.category,
      type: k.type,
      content: k.content,
      sourceRef: k.sourceRef ?? null,
      durationSec: k.durationSec ?? 30,
    })),
  })

  const cardCategoryCount: Record<string, number> = {}
  for (const k of knowledgeCards) {
    cardCategoryCount[k.category] = (cardCategoryCount[k.category] || 0) + 1
  }
  console.log(`   ✓ 共插入 ${knowledgeCards.length} 张知识卡`)
  for (const [cat, n] of Object.entries(cardCategoryCount)) {
    console.log(`     - ${cat}: ${n} 张`)
  }
  console.log()

  // ========== 5. 完成统计 ==========
  console.log('═══════════════════════════════════════')
  console.log('✅ Seed 完成！')
  console.log('═══════════════════════════════════════')
  console.log(`  食物库: ${allFoods.length} 种`)
  console.log(`  demo user: ${demoEmail}`)
  console.log(`  Persona: ${defaultPersonas.length} 种`)
  console.log(`  知识卡: ${knowledgeCards.length} 张`)
  console.log('═══════════════════════════════════════\n')
}

main()
  .catch((e) => {
    console.error('❌ Seed 失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
