import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  getUserInsights,
  exportUserTransactionsCsv,
} from '../controllers/insights.controller.js';

const router = express.Router();

// All insight routes require an authenticated user session
router.use(requireAuth);

router.get('/', getUserInsights);
router.get('/export-csv', exportUserTransactionsCsv);

export default router;
