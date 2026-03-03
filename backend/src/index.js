import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'

import authRoutes from './routes/auth.routes.js'
import deviceRoutes from './routes/device.routes.js'
import sensorRoutes from './routes/sensor.routes.js'
import readingRoutes from './routes/reading.routes.js'
import actuatorRoutes from './routes/actuator.routes.js'
import controlRoutes from './routes/control.routes.js'
import alertRoutes from './routes/alert.routes.js'
import automationRoutes from './routes/automation.routes.js'
import auditRoutes from './routes/audit.routes.js'
import userRoutes from './routes/user.routes.js'

import { errorHandler } from './middleware/errorHandler.js'
import { notFound } from './middleware/notFound.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// ── Security & Middleware ─────────────────────────────────────────────────────
app.use(helmet())
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow localhost and local network IPs (e.g., 192.168.x.x)
    const allowed = origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      origin.includes('192.168.') ||
      origin === process.env.FRONTEND_URL;

    if (allowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}))
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ── Global Rate Limiter ───────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: { error: 'Too many requests, please try again later.' }
})
app.use('/api', limiter)

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), service: 'BioScope API' })
})

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/devices', deviceRoutes)
app.use('/api/sensors', sensorRoutes)
app.use('/api/readings', readingRoutes)
app.use('/api/actuators', actuatorRoutes)
app.use('/api/controls', controlRoutes)
app.use('/api/alerts', alertRoutes)
app.use('/api/automation', automationRoutes)
app.use('/api/audit', auditRoutes)

// ── Error Handlers ────────────────────────────────────────────────────────────
app.use(notFound)
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`🚀 BioScope API running on http://localhost:${PORT}`)
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`)
})

export default app


