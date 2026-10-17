import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  getSavingsGoals,
  createSavingsGoal,
  addContribution,
  archiveSavingsGoal,
} from '../controllers/savingsGoal.controller.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', getSavingsGoals);
router.post('/', createSavingsGoal);
router.post('/:id/contributions', addContribution);
router.patch('/:id/archive', archiveSavingsGoal);

export default router;
