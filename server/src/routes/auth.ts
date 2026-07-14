import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { signToken } from '../lib/jwt.js'
import { authRequired } from '../middleware/auth.js'

const router = Router()

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(64),
  nickname: z.string().min(1).max(32).optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

// 注册
router.post('/register', async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: '输入不合法', details: parsed.error.flatten() })
    }
    const { email, password, nickname } = parsed.data

    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) {
      return res.status(409).json({ error: '该邮箱已注册' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { email, passwordHash, nickname },
      select: { id: true, email: true, nickname: true },
    })

    const token = signToken({ userId: user.id, email: user.email })
    res.status(201).json({ token, user })
  } catch (err) {
    next(err)
  }
})

// 登录
router.post('/login', async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: '输入不合法' })
    }
    const { email, password } = parsed.data

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return res.status(401).json({ error: '邮箱或密码错误' })
    }

    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) {
      return res.status(401).json({ error: '邮箱或密码错误' })
    }

    const token = signToken({ userId: user.id, email: user.email })
    res.json({
      token,
      user: { id: user.id, email: user.email, nickname: user.nickname },
    })
  } catch (err) {
    next(err)
  }
})

// 获取当前用户
router.get('/me', authRequired, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, email: true, nickname: true, birthYear: true, gender: true, createdAt: true },
    })
    if (!user) return res.status(404).json({ error: '用户不存在' })
    res.json({ user })
  } catch (err) {
    next(err)
  }
})

export default router
