import express from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';
import {
  calculateLoan,
  calculateInvestment,
  getVerifiedSources,
  adminCreateSource,
  verifyScamOrWebsite,
  getLoanProducts,
  compareLoans,
  calculateAffordability,
  calculateEducationGap,
  getLoanLearningTopics,
  queryLoanAssistant,
} from '../controllers/guidance.controller.js';

const router = express.Router();

// Specific rate limiter for scam verification to protect network and prevent abuse
const scamVerificationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // limit each IP to 30 scam verification queries per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many verification requests submitted. Please wait a few moments before trying again.',
  },
});

// Dedicated rate limiter for AI Loan Assistant queries
const loanAssistantLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // 30 AI assistant requests per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many loan assistant requests. Please wait a moment before asking another question.',
  },
});

// Public / Learner authenticated endpoints
router.use(requireAuth);

router.post('/calculate-loan', calculateLoan);
router.post('/calculate-investment', calculateInvestment);
router.get('/sources', getVerifiedSources);
router.post('/verify-scam', scamVerificationLimiter, verifyScamOrWebsite);

// Loan Guide & Smart Borrowing Module APIs
router.get('/loans/products', getLoanProducts);
router.post('/loans/compare', compareLoans);
router.post('/loans/affordability', calculateAffordability);
router.post('/loans/education-gap', calculateEducationGap);
router.get('/loans/learning', getLoanLearningTopics);
router.post('/loans/assistant', loanAssistantLimiter, queryLoanAssistant);

// Admin-Only Source Registry Governance
router.post('/admin/sources', requireAdmin, adminCreateSource);

export default router;
