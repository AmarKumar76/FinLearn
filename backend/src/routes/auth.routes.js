import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller.js';
import { validateRegister, validateLogin } from '../validators/auth.validator.js';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';
import { successResponse } from '../utils/apiResponse.js';

const router = express.Router();

// Specific brute-force protection rate limiter for authentication endpoints
// 20 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
});

// Public authentication routes
router.post('/register', authLimiter, validateRegister, register);
router.post('/signup', authLimiter, validateRegister, register);
router.post('/login', authLimiter, validateLogin, login);
router.post('/signin', authLimiter, validateLogin, login);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

// Protected session & profile routes
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, getMe);
router.patch('/profile', requireAuth, updateProfile);
router.post('/change-password', requireAuth, changePassword);

// Dedicated RBAC test endpoint for verification
router.get('/admin-only', requireAuth, requireAdmin, (req, res) => {
  return successResponse(
    res,
    { adminAccessGranted: true, user: req.user.toJSON() },
    'Admin access granted'
  );
});

export default router;
