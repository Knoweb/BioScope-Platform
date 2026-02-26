import { Router } from 'express'
import {
  getAlertRules, createAlertRule, updateAlertRule, deleteAlertRule,
  getAlerts, getActiveAlerts, createAlert, acknowledgeAlert, resolveAlert
} from '../controllers/alert.controller.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

// Alert Rules
router.get('/rules', getAlertRules)
router.post('/rules', requireRole('admin', 'operator', 'user'), createAlertRule)
router.patch('/rules/:id', requireRole('admin', 'operator', 'user'), updateAlertRule)
router.delete('/rules/:id', requireRole('admin', 'operator'), deleteAlertRule)

// Alert Instances
router.get('/active', getActiveAlerts)
router.get('/', getAlerts)
router.post('/', requireRole('admin', 'operator'), createAlert)
router.patch('/:id/acknowledge', acknowledgeAlert)
router.patch('/:id/resolve', requireRole('admin', 'operator', 'user'), resolveAlert)

export default router
