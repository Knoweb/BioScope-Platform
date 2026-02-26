import { Router } from 'express'
import { getDevices, getDeviceById, createDevice, updateDevice, deleteDevice, getDeviceSummary } from '../controllers/device.controller.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

router.get('/',           getDevices)
router.get('/:id',        getDeviceById)
router.get('/:id/summary', getDeviceSummary)
router.post('/',          requireRole('admin', 'operator'), createDevice)
router.patch('/:id',      requireRole('admin', 'operator'), updateDevice)
router.delete('/:id',     requireRole('admin'), deleteDevice)

export default router
