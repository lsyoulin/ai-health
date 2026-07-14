import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import authRoutes from './routes/auth.js'
import foodRoutes from './routes/food.js'
import recordRoutes from './routes/record.js'
import personaRoutes from './routes/persona.js'
import knowledgeRoutes from './routes/knowledge.js'
import optimizeRoutes from './routes/optimize.js'
import legalRoutes from './routes/legal.js'
import { errorHandler } from './middleware/error.js'
import { notFound } from './middleware/notFound.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173'

app.use(cors({
  origin: CORS_ORIGIN.split(','),
  credentials: true,
}))
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))

// 健康检查
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'zhishi-server', time: new Date().toISOString() })
})

// 路由
app.use('/api/auth', authRoutes)
app.use('/api/foods', foodRoutes)
app.use('/api/records', recordRoutes)
app.use('/api/personas', personaRoutes)
app.use('/api/knowledge', knowledgeRoutes)
app.use('/api/optimize', optimizeRoutes)
app.use('/api/legal', legalRoutes)

// 404 + 错误处理
app.use(notFound)
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`🍜 知食后端已启动: http://localhost:${PORT}`)
  console.log(`   环境: ${process.env.NODE_ENV || 'development'}`)
})
