import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
} from '../controllers/budget.controller.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', getBudgets);
router.post('/', createBudget);
router.patch('/:id', updateBudget);
router.delete('/:id', deleteBudget);

export default router;
