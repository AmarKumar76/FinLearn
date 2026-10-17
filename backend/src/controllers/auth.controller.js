import { User } from '../models/user.model.js';
import { generateToken, setAuthCookie, clearAuthCookie } from '../utils/token.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

/**
 * Register a new user
 * POST /api/v1/auth/register
 */
export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    // Check for duplicate account (case-insensitive checked via normalized email)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(
        res,
        'An account with this email address already exists.',
        'DUPLICATE_EMAIL',
        409
      );
    }

    // Create user (role defaults strictly to 'user' in schema)
    const user = new User({
      name,
      email,
      passwordHash: password, // Pre-save hook will hash this securely
      role: 'user',
      accountStatus: 'active',
    });

    await user.save();

    // Generate JWT token and set HttpOnly cookie
    const token = generateToken(user);
    setAuthCookie(res, token);

    return successResponse(
      res,
      {
        user: user.toJSON(),
        token,
      },
      'Registration successful',
      201
    );
  } catch (err) {
    if (err.code === 11000) {
      return errorResponse(
        res,
        'An account with this email address already exists.',
        'DUPLICATE_EMAIL',
        409
      );
    }
    return next(err);
  }
}

/**
 * Log in an existing user
 * POST /api/v1/auth/login
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // Load user including passwordHash for verification
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) {
      // Safe timing / generic error response
      return errorResponse(
        res,
        'Invalid email or password',
        'INVALID_CREDENTIALS',
        401
      );
    }

    // Verify account status
    if (user.accountStatus !== 'active') {
      return errorResponse(
        res,
        'Account is disabled or suspended. Please contact support.',
        'ACCOUNT_DISABLED',
        403
      );
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return errorResponse(
        res,
        'Invalid email or password',
        'INVALID_CREDENTIALS',
        401
      );
    }

    // Update lastLoginAt
    user.lastLoginAt = new Date();
    await user.save();

    // Generate token and set cookie
    const token = generateToken(user);
    setAuthCookie(res, token);

    return successResponse(
      res,
      {
        user: user.toJSON(),
        token,
      },
      'Login successful',
      200
    );
  } catch (err) {
    return next(err);
  }
}

/**
 * Log out user (clears cookie & increments tokenVersion for absolute revocation)
 * POST /api/v1/auth/logout
 */
export async function logout(req, res, next) {
  try {
    if (req.user) {
      // Invalidate current and all prior issued tokens by incrementing tokenVersion
      await req.user.incrementTokenVersion();
    }

    clearAuthCookie(res);

    return successResponse(
      res,
      { loggedOut: true },
      'Successfully logged out'
    );
  } catch (err) {
    return next(err);
  }
}

/**
 * Get current authenticated user profile
 * GET /api/v1/auth/me
 */
export async function getMe(req, res) {
  return successResponse(
    res,
    { user: req.user.toJSON() },
    'Current user retrieved'
  );
}

export default {
  register,
  login,
  logout,
  getMe,
};
