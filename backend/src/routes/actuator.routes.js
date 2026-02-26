import { Router } from 'express'
import { getActuators, getActuatorById, createActuator, updateActuator, deleteActuator, toggleActuator } from '../controllers/actuator.controller.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

router.get('/',               getActuators)
router.get('/:id',            getActuatorById)
router.post('/',              requireRole('admin', 'operator'), createActuator)
router.patch('/:id',          requireRole('admin', 'operator'), updateActuator)
router.patch('/:id/toggle',   requireRole('admin', 'operator'), toggleActuator)
router.delete('/:id',         requireRole('admin'), deleteActuator)

export default router
