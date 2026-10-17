import jwt from 'jsonwebtoken';
import config from '../config/env.js';

export const AUTH_COOKIE_NAME = 'finlearn_auth_token';

/**
 * Generate a signed JWT for a user
 * Payload includes userId, role, email, and tokenVersion for immediate revocation
 */
export function generateToken(user) {
  const payload = {
    userId: user._id ? user._id.toString() : user.id,
    role: user.role,
    email: user.email,
    tokenVersion: user.tokenVersion || 0,
  };

  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
    issuer: 'finlearn-auth-service',
    audience: 'finlearn-client',
  });
}

/**
 * Verify JWT token securely
 */
export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, config.jwtSecret, {
      issuer: 'finlearn-auth-service',
      audience: 'finlearn-client',
    });
    return { valid: true, decoded, error: null };
  } catch (err) {
    let errorCode = 'INVALID_TOKEN';
    if (err.name === 'TokenExpiredError') {
      errorCode = 'TOKEN_EXPIRED';
    } else if (err.name === 'JsonWebTokenError') {
      errorCode = 'MALFORMED_TOKEN';
    }
    return { valid: false, decoded: null, error: errorCode, message: err.message };
  }
}

/**
 * Helper to set secure auth cookie
 */
export function setAuthCookie(res, token) {
  const isSecure = config.isProduction;
  const maxAgeMs = config.cookieMaxAgeDays * 24 * 60 * 60 * 1000;

  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    maxAge: maxAgeMs,
    path: '/',
  });
}

/**
 * Helper to clear auth cookie
 */
export function clearAuthCookie(res) {
  const isSecure = config.isProduction;

  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    path: '/',
  });
}

export default {
  AUTH_COOKIE_NAME,
  generateToken,
  verifyToken,
  setAuthCookie,
  clearAuthCookie,
};
