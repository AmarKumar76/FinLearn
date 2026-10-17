import express from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';
import {
  getAdminAnalytics,
  getAdminAuditLogs,
} from '../controllers/adminAudit.controller.js';

const router = express.Router();

// Admin workspace routes require authenticated session with admin role
router.use(requireAuth, requireAdmin);

router.get('/analytics', getAdminAnalytics);
router.get('/audit-logs', getAdminAuditLogs);

export default router;
