import { Router } from 'express'
import { triggerControl, getControlHistory, getControlById } from '../controllers/control.controller.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

router.get('/', getControlHistory)
router.get('/:id', getControlById)
router.post('/', requireRole('admin', 'operator', 'user'), triggerControl)

export default router
