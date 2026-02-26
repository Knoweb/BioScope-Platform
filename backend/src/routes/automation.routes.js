import { Router } from 'express'
import { getAutomationRules, getAutomationRuleById, createAutomationRule, updateAutomationRule, deleteAutomationRule } from '../controllers/automation.controller.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

router.get('/',      getAutomationRules)
router.get('/:id',   getAutomationRuleById)
router.post('/',     requireRole('admin', 'operator'), createAutomationRule)
router.patch('/:id', requireRole('admin', 'operator'), updateAutomationRule)
router.delete('/:id',requireRole('admin'), deleteAutomationRule)

export default router
