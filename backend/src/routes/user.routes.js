import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  getMyProfile,
  updateMyProfile,
  getPublicProfile,
} from '../controllers/user.controller.js';

const router = Router();

// Current user profile (authenticated)
router.get('/me/profile', requireAuth, getMyProfile);
router.patch('/me/profile', requireAuth, updateMyProfile);

// Public user profile by username (optional authentication to check ownership)
// If an auth header or cookie is present, requireAuth isn't mandatory for public viewing,
// but we want to know if the caller is the owner
router.get('/profile/:username', async (req, res, next) => {
  // Try soft auth if token is present
  try {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.token;
    const token = (authHeader && authHeader.startsWith('Bearer '))
      ? authHeader.slice(7)
      : cookieToken;

    if (token) {
      const jwt = (await import('jsonwebtoken')).default;
      const config = (await import('../config/env.js')).default;
      const { User } = await import('../models/user.model.js');
      const decoded = jwt.verify(token, config.jwtSecret);
      const user = await User.findById(decoded.id);
      if (user && user.accountStatus === 'active') {
        req.user = user;
      }
    }
  } catch {
    // Proceed as unauthenticated guest
  }
  return getPublicProfile(req, res, next);
});

export default router;
