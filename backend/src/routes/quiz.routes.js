import express from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';
import {
  getPublishedQuizzes,
  getQuizById,
  submitQuizAttempt,
  getAttemptReview,
  getGamificationProfile,
  generateModulePracticeQuiz,
  adminGetQuizzes,
  adminCreateQuiz,
  adminUpdateQuiz,
  adminAddQuestion,
  adminGenerateQuizDraft,
} from '../controllers/quiz.controller.js';

const router = express.Router();

// All quiz routes require an active authenticated user session
router.use(requireAuth);

// Learner Assessment & Gamification APIs
router.get('/quizzes', getPublishedQuizzes);
router.post('/quizzes/generate-practice', generateModulePracticeQuiz);
router.get('/quizzes/:id', getQuizById);
router.post('/quizzes/:id/submit', submitQuizAttempt);
router.get('/quizzes/attempts/:attemptId', getAttemptReview);
router.get('/gamification/profile', getGamificationProfile);

// Admin-Only Quiz Authoring & Management APIs
router.get('/admin/quizzes', requireAdmin, adminGetQuizzes);
router.post('/admin/quizzes', requireAdmin, adminCreateQuiz);
router.post('/admin/quizzes/generate-draft', requireAdmin, adminGenerateQuizDraft);
router.patch('/admin/quizzes/:id', requireAdmin, adminUpdateQuiz);
router.post('/admin/quizzes/:id/questions', requireAdmin, adminAddQuestion);

export default router;
