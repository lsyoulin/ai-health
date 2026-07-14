import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { authRequired } from '../middleware/auth.js'

const router = Router()

// 合法 docType 白名单
const VALID_DOC_TYPES = [
  'user_agreement',
  'privacy_policy',
  'health_consent',
  'disclaimer',
] as const

const agreeSchema = z.object({
  docIds: z.array(z.string()).min(1).max(10),
  source: z.enum(['register', 'settings', 'upgrade']).default('register'),
})

// ============ 公开路由（无需登录） ============

// 列出所有当前生效的合规文档
router.get('/docs', async (_req, res, next) => {
  try {
    const docs = await prisma.legalDoc.findMany({
      where: { isActive: true },
      orderBy: { effectiveDate: 'desc' },
      select: {
        id: true,
        docType: true,
        version: true,
        title: true,
        content: true,
        effectiveDate: true,
      },
    })
    res.json({ docs })
  } catch (err) {
    next(err)
  }
})

// 获取指定类型的当前生效版本（用于免责声明等频繁展示场景）
router.get('/docs/:docType', async (req, res, next) => {
  try {
    const { docType } = req.params
    if (!VALID_DOC_TYPES.includes(docType as any)) {
      return res.status(400).json({ error: `不支持的文档类型: ${docType}` })
    }
    const doc = await prisma.legalDoc.findFirst({
      where: { docType, isActive: true },
      orderBy: { effectiveDate: 'desc' },
      select: {
        id: true,
        docType: true,
        version: true,
        title: true,
        content: true,
        effectiveDate: true,
      },
    })
    if (!doc) {
      return res.status(404).json({ error: '文档不存在' })
    }
    res.json({ doc })
  } catch (err) {
    next(err)
  }
})

// ============ 需要登录的路由 ============

// 用户同意（批量记录）
router.post('/agree', authRequired, async (req, res, next) => {
  try {
    const parsed = agreeSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: '输入不合法', details: parsed.error.flatten() })
    }
    const { docIds, source } = parsed.data
    const userId = req.user!.userId

    // 查询文档（必须存在且为当前生效版本）
    const docs = await prisma.legalDoc.findMany({
      where: { id: { in: docIds }, isActive: true },
    })
    if (docs.length !== docIds.length) {
      const found = new Set(docs.map((d) => d.id))
      const missing = docIds.filter((id) => !found.has(id))
      return res.status(400).json({ error: `文档不存在或已失效: ${missing.join(', ')}` })
    }

    // 提取 IP 和 UserAgent（审计用）
    const ipAddress = req.ip || req.socket.remoteAddress || null
    const userAgent = req.headers['user-agent'] || null

    // 幂等：先删除同一用户对这些文档的旧同意记录，再写入新记录
    await prisma.userAgreement.deleteMany({
      where: { userId, docId: { in: docIds } },
    })
    const created = await prisma.userAgreement.createMany({
      data: docs.map((doc) => ({
        userId,
        docId: doc.id,
        docType: doc.docType,
        version: doc.version,
        agreeSource: source,
        ipAddress,
        userAgent,
      })),
    })

    res.status(201).json({
      agreed: true,
      count: created.count,
      docs: docs.map((d) => ({ id: d.id, docType: d.docType, version: d.version })),
      agreedAt: new Date().toISOString(),
    })
  } catch (err) {
    next(err)
  }
})

// 查询当前用户的同意历史（合规审计用）
router.get('/agreements', authRequired, async (req, res, next) => {
  try {
    const userId = req.user!.userId
    const agreements = await prisma.userAgreement.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        docType: true,
        version: true,
        agreeSource: true,
        ipAddress: true,
        createdAt: true,
        doc: {
          select: {
            id: true,
            title: true,
            effectiveDate: true,
          },
        },
      },
    })

    // 按文档类型分组（取最新一条）
    const latestByType: Record<string, typeof agreements[0]> = {}
    for (const a of agreements) {
      if (!latestByType[a.docType]) {
        latestByType[a.docType] = a
      }
    }

    res.json({
      agreements,
      latest: Object.values(latestByType),
      // 检查必须同意的文档是否齐全
      requiredDocs: VALID_DOC_TYPES,
      agreedDocTypes: Object.keys(latestByType),
      allRequiredAgreed: VALID_DOC_TYPES.every((t) => latestByType[t]),
    })
  } catch (err) {
    next(err)
  }
})

// 检查用户是否已同意所有必需文档（注册流程前置校验）
router.get('/status', authRequired, async (req, res, next) => {
  try {
    const userId = req.user!.userId
    const required = ['user_agreement', 'privacy_policy', 'health_consent'] as const

    const latestAgreements = await Promise.all(
      required.map(async (docType) => {
        const latest = await prisma.userAgreement.findFirst({
          where: { userId, docType },
          orderBy: { createdAt: 'desc' },
        })
        return { docType, agreed: !!latest, version: latest?.version || null }
      })
    )

    const allAgreed = latestAgreements.every((a) => a.agreed)

    res.json({
      allAgreed,
      details: latestAgreements,
    })
  } catch (err) {
    next(err)
  }
})

export default router
