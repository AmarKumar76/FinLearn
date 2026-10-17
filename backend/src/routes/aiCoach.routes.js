import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  getConversation,
  askCoach,
  resetConversation,
  syncKnowledge,
} from '../controllers/aiCoach.controller.js';

const router = express.Router();

// All AI Money Coach routes require authenticated user session
router.use(requireAuth);

router.get('/conversation', getConversation);
router.post('/query', askCoach);
router.post('/reset', resetConversation);
router.post('/sync-knowledge', syncKnowledge);

export default router;
