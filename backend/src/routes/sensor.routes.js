import { Router } from 'express'
import { getSensors, getSensorById, createSensor, updateSensor, deleteSensor, getSensorTypes } from '../controllers/sensor.controller.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

router.get('/types', getSensorTypes)
router.get('/',      getSensors)
router.get('/:id',   getSensorById)
router.post('/',     requireRole('admin', 'operator'), createSensor)
router.patch('/:id', requireRole('admin', 'operator'), updateSensor)
router.delete('/:id',requireRole('admin'), deleteSensor)

export default router
