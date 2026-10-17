import { verifyToken, AUTH_COOKIE_NAME } from '../utils/token.js';
import { User } from '../models/user.model.js';
import { errorResponse } from '../utils/apiResponse.js';

/**
 * Authentication middleware
 * Supports both HttpOnly cookie and Bearer Authorization header
 */
export async function requireAuth(req, res, next) {
  let token = null;

  // 1. Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  // 2. Fall back to signed/HttpOnly cookie
  if (!token && req.cookies && req.cookies[AUTH_COOKIE_NAME]) {
    token = req.cookies[AUTH_COOKIE_NAME];
  }

  if (!token) {
    return errorResponse(
      res,
      'Authentication required to access this resource',
      'UNAUTHORIZED',
      401
    );
  }

  // Verify JWT
  const verification = verifyToken(token);
  if (!verification.valid) {
    const isExpired = verification.error === 'TOKEN_EXPIRED';
    return errorResponse(
      res,
      isExpired ? 'Session has expired. Please log in again.' : 'Invalid or malformed credentials',
      verification.error,
      401
    );
  }

  const { userId, tokenVersion } = verification.decoded;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, 'User account no longer exists', 'USER_NOT_FOUND', 401);
    }

    // Check account status
    if (user.accountStatus !== 'active') {
      return errorResponse(
        res,
        'Account is disabled or suspended. Please contact support.',
        'ACCOUNT_DISABLED',
        403
      );
    }

    // Check token version (revocation verification)
    if (user.tokenVersion !== tokenVersion) {
      return errorResponse(
        res,
        'Session has been invalidated. Please log in again.',
        'SESSION_REVOKED',
        401
      );
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (err) {
    return next(err);
  }
}

/**
 * Role-Based Access Control Middleware
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required', 'UNAUTHORIZED', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(
        res,
        'Access denied: insufficient permissions for this operation',
        'FORBIDDEN',
        403
      );
    }

    next();
  };
}

/**
 * Admin Role Shorthand
 */
export const requireAdmin = requireRole('admin');

/**
 * Resource Ownership Verification Middleware Helper
 * Ensures the resource's owner matches the authenticated user
 */
export function requireOwnership(getOwnerIdFromReq) {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required', 'UNAUTHORIZED', 401);
    }

    const resourceOwnerId = getOwnerIdFromReq(req);
    if (!resourceOwnerId) {
      return errorResponse(res, 'Target resource not found', 'NOT_FOUND', 404);
    }

    if (resourceOwnerId.toString() !== req.user._id.toString()) {
      // Return 404 or 403 without leaking data
      return errorResponse(res, 'Resource not found or access denied', 'FORBIDDEN', 403);
    }

    next();
  };
}

export default {
  requireAuth,
  requireRole,
  requireAdmin,
  requireOwnership,
};
