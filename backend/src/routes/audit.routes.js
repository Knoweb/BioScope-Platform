import { Router } from 'express'
import { getAuditLog, getDeviceAuditLog, createAuditEntry } from '../controllers/audit.controller.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

router.get('/',                    requireRole('admin', 'operator'), getAuditLog)
router.get('/device/:deviceId',    getAuditLog)
router.post('/',                   createAuditEntry)

export default router
