import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '../controllers/transaction.controller.js';

const router = express.Router();

// All transaction endpoints require authenticated session
router.use(requireAuth);

router.get('/', getTransactions);
router.post('/', createTransaction);
router.get('/:id', getTransactionById);
router.patch('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

export default router;
