import type { Request, Response, NextFunction } from 'express'
import { verifyToken, type JwtPayload } from '../lib/jwt.js'

// 扩展 Request 类型，挂载 user
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

export function authRequired(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未提供认证令牌' })
  }
  const token = authHeader.slice(7)
  const payload = verifyToken(token)
  if (!payload) {
    return res.status(401).json({ error: '认证令牌无效或已过期' })
  }
  req.user = payload
  next()
}

// 可选认证：有 token 就解析，没有就跳过
export function authOptional(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const payload = verifyToken(token)
    if (payload) req.user = payload
  }
  next()
}
