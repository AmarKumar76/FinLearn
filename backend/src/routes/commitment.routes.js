import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  getCommitments,
  createCommitment,
  recordPayment,
  archiveCommitment,
} from '../controllers/commitment.controller.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', getCommitments);
router.post('/', createCommitment);
router.post('/:id/payments', recordPayment);
router.patch('/:id/archive', archiveCommitment);

export default router;
