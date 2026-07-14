import type { Request, Response } from 'express'

export function notFound(req: Request, res: Response) {
  res.status(404).json({ error: `接口不存在: ${req.method} ${req.path}` })
}
