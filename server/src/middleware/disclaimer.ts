import type { Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma.js'

// 默认免责声明（数据库不可用时的兜底）
const FALLBACK_DISCLAIMER = {
  text: '本结果基于公开营养学与慢病管理研究，由 AI 模型辅助生成，仅供参考。不能替代医生或营养师的专业建议。如有不适请立即就医或拨打 120。',
  version: 'fallback',
  docType: 'disclaimer',
}

let cachedDisclaimer: { text: string; version: string; docType: string } | null = null
let cacheExpiresAt = 0

/**
 * 获取当前生效的免责声明（带 5 分钟缓存，避免每次查询数据库）
 */
async function getActiveDisclaimer() {
  const now = Date.now()
  if (cachedDisclaimer && now < cacheExpiresAt) {
    return cachedDisclaimer
  }

  try {
    const doc = await prisma.legalDoc.findFirst({
      where: { docType: 'disclaimer', isActive: true },
      orderBy: { effectiveDate: 'desc' },
      select: { content: true, version: true },
    })
    if (doc) {
      cachedDisclaimer = {
        text: doc.content,
        version: doc.version,
        docType: 'disclaimer',
      }
      // 缓存 5 分钟
      cacheExpiresAt = now + 5 * 60 * 1000
      return cachedDisclaimer
    }
  } catch {
    // 数据库错误时使用 fallback
  }

  return FALLBACK_DISCLAIMER
}

/**
 * 免责声明附加中间件
 *
 * 用法：在路由处理完成后调用 attachDisclaimer(req, res)
 * 或作为中间件：res.on('finish') 之前注入
 *
 * 实际用法：在路由 handler 中调用 await attachDisclaimer(req, res, responseData)
 */
export async function attachDisclaimer<T extends Record<string, any>>(
  _req: Request,
  res: Response,
  data: T
): Promise<T & { disclaimer: { text: string; version: string; docType: string } }> {
  const disclaimer = await getActiveDisclaimer()
  res.setHeader('X-Disclaimer-Version', disclaimer.version)
  return { ...data, disclaimer }
}

/**
 * Express 中间件：为所有 JSON 响应自动附加 disclaimer 字段
 * （仅适用于不需要精细控制响应结构的场景，目前未启用，保留备用）
 */
export function disclaimerMiddleware(_req: Request, res: Response, next: NextFunction) {
  const originalJson = res.json.bind(res)
  res.json = (body: any) => {
    // 仅对对象响应附加，且响应中尚未包含 disclaimer
    if (body && typeof body === 'object' && !Array.isArray(body) && !body.disclaimer) {
      getActiveDisclaimer()
        .then((disclaimer) => {
          body.disclaimer = disclaimer
          originalJson(body)
        })
        .catch(() => originalJson(body))
      return res
    }
    return originalJson(body)
  }
  next()
}

/**
 * 主动清除免责声明缓存（用于测试或文档更新后立即生效）
 */
export function clearDisclaimerCache() {
  cachedDisclaimer = null
  cacheExpiresAt = 0
}
