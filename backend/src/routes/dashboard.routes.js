import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { getDashboardSummary } from '../controllers/dashboard.controller.js';

const router = express.Router();

router.use(requireAuth);

router.get('/summary', getDashboardSummary);

export default router;
