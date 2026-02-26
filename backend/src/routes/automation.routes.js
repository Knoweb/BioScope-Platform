import { Router } from 'express'
import { getAutomationRules, getAutomationRuleById, createAutomationRule, updateAutomationRule, deleteAutomationRule } from '../controllers/automation.controller.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

router.get('/', getAutomationRules)
router.get('/:id', getAutomationRuleById)
router.post('/', requireRole('admin', 'owner', 'operator'), createAutomationRule)
router.patch('/:id', requireRole('admin', 'owner', 'operator'), updateAutomationRule)
router.delete('/:id', requireRole('admin', 'owner'), deleteAutomationRule)

export default router
