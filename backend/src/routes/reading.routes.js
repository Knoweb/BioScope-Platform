import { Router } from 'express'
import { getReadings, getLatestReading, getReadingStats, createReading, getChartData } from '../controllers/reading.controller.js'
import { authenticate } from '../middleware/auth.js'
import rateLimit from 'express-rate-limit'

const router = Router()

// Tighter rate limit for high-frequency reading ingestion
const readingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  message: { error: 'Too many reading requests' }
})

router.use(authenticate)

router.get('/',        getReadings)
router.get('/latest',  getLatestReading)
router.get('/stats',   getReadingStats)
router.get('/chart',   getChartData)
router.post('/',       readingLimiter, createReading)

export default router
