import { Router } from 'express'
import { getUsers, getUserById, updateUser, deleteUser, getUserPreferences, updateUserPreferences } from '../controllers/user.controller.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

router.get('/preferences',    getUserPreferences)
router.patch('/preferences',  updateUserPreferences)

router.get('/',      requireRole('admin'), getUsers)
router.get('/:id',   requireRole('admin'), getUserById)
router.patch('/:id', requireRole('admin'), updateUser)
router.delete('/:id',requireRole('admin'), deleteUser)

export default router
