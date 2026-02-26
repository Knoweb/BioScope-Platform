import { Router } from 'express'
import { signUp, signIn, signOut, refreshToken, resetPassword, getMe, updateMe } from '../controllers/auth.controller.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.post('/signup',         signUp)
router.post('/signin',         signIn)
router.post('/signout',        authenticate, signOut)
router.post('/refresh',        refreshToken)
router.post('/reset-password', resetPassword)
router.get('/me',              authenticate, getMe)
router.put('/me',              authenticate, updateMe)

export default router
