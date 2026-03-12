import { Router } from 'express'
import { getDevices, getDeviceById, createDevice, updateDevice, deleteDevice, getDeviceSummary, getSlotAssignment, updateSlotAssignment, getLatestControlState } from '../controllers/device.controller.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

router.get('/', getDevices)
router.get('/:id', getDeviceById)
router.get('/:id/summary', getDeviceSummary)
router.get('/:id/slots', getSlotAssignment)
router.get('/:id/latest-state', getLatestControlState)
router.patch('/:id/slots', requireRole('admin', 'operator'), updateSlotAssignment)
router.post('/', requireRole('admin', 'operator'), createDevice)
router.patch('/:id', requireRole('admin', 'operator'), updateDevice)
router.delete('/:id', requireRole('admin'), deleteDevice)

export default router
