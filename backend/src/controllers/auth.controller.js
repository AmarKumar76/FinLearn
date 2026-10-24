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

/**
 * Update authenticated user profile and preferences
 * PATCH /api/v1/auth/profile
 */
export async function updateProfile(req, res, next) {
  try {
    const { name, username, bio, isProfilePublic, preferences } = req.body;
    const user = req.user;

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2) {
        return errorResponse(res, 'Name must be at least 2 characters long', 'VALIDATION_ERROR', 400);
      }
      user.name = name.trim();
    }

    if (username !== undefined) {
      const cleanUsername = username.trim().toLowerCase();
      if (cleanUsername) {
        if (!/^[a-zA-Z0-9_]{3,30}$/.test(cleanUsername)) {
          return errorResponse(
            res,
            'Username must be 3-30 characters with alphanumeric characters and underscores only',
            'VALIDATION_ERROR',
            400
          );
        }
        // Check uniqueness if changed
        if (cleanUsername !== user.username) {
          const exists = await User.findOne({ username: cleanUsername });
          if (exists && exists._id.toString() !== user._id.toString()) {
            return errorResponse(res, 'Username is already taken', 'DUPLICATE_USERNAME', 409);
          }
          user.username = cleanUsername;
        }
      }
    }

    if (bio !== undefined) {
      user.bio = typeof bio === 'string' ? bio.slice(0, 300) : '';
    }

    if (isProfilePublic !== undefined) {
      user.isProfilePublic = Boolean(isProfilePublic);
    }

    if (preferences && typeof preferences === 'object') {
      if (preferences.timezone) user.preferences.timezone = preferences.timezone;
      if (preferences.theme && ['system', 'light', 'dark', 'amoled'].includes(preferences.theme)) {
        user.preferences.theme = preferences.theme;
      }
      if (preferences.notifications && typeof preferences.notifications === 'object') {
        if (preferences.notifications.inApp !== undefined) {
          user.preferences.notifications.inApp = Boolean(preferences.notifications.inApp);
        }
        if (preferences.notifications.email !== undefined) {
          user.preferences.notifications.email = Boolean(preferences.notifications.email);
        }
      }
    }

    await user.save();

    return successResponse(
      res,
      { user: user.toJSON() },
      'Profile updated successfully'
    );
  } catch (err) {
    if (err.code === 11000) {
      return errorResponse(res, 'Username already taken', 'DUPLICATE_USERNAME', 409);
    }
    return next(err);
  }
}

/**
 * Change Password for authenticated user
 * POST /api/v1/auth/change-password
 */
export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return errorResponse(res, 'Current password and new password are required', 'VALIDATION_ERROR', 400);
    }

    if (newPassword.length < 8) {
      return errorResponse(res, 'New password must be at least 8 characters long', 'VALIDATION_ERROR', 400);
    }

    const user = await User.findById(req.user._id).select('+passwordHash');
    if (!user) {
      return errorResponse(res, 'User not found', 'NOT_FOUND', 404);
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return errorResponse(res, 'Current password is incorrect', 'INVALID_CREDENTIALS', 401);
    }

    user.passwordHash = newPassword; // Pre-save hook hashes this
    await user.incrementTokenVersion(); // Revoke prior tokens
    await user.save();

    // Re-issue fresh token
    const token = generateToken(user);
    setAuthCookie(res, token);

    return successResponse(
      res,
      { user: user.toJSON(), token },
      'Password changed successfully'
    );
  } catch (err) {
    return next(err);
  }
}

/**
 * Request Password Reset (generates secure single-use expiring token)
 * POST /api/v1/auth/forgot-password
 */
export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) {
      return errorResponse(res, 'Email address is required', 'VALIDATION_ERROR', 400);
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    // Generic response to prevent user enumeration
    const genericSuccessMsg = 'If an account exists with this email, password reset instructions have been generated.';

    if (!user) {
      return successResponse(res, { requestReceived: true }, genericSuccessMsg);
    }

    // Generate crypto-secure random reset token
    const crypto = await import('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Token expires in 1 hour
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    // Return token in payload for development/testing and local verification
    return successResponse(
      res,
      {
        requestReceived: true,
        resetToken: process.env.NODE_ENV !== 'production' ? resetToken : undefined,
      },
      genericSuccessMsg
    );
  } catch (err) {
    return next(err);
  }
}

/**
 * Reset Password using expiring single-use token
 * POST /api/v1/auth/reset-password
 */
export async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return errorResponse(res, 'Reset token and new password are required', 'VALIDATION_ERROR', 400);
    }

    if (newPassword.length < 8) {
      return errorResponse(res, 'New password must be at least 8 characters long', 'VALIDATION_ERROR', 400);
    }

    const crypto = await import('crypto');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return errorResponse(
        res,
        'Password reset token is invalid or has expired. Please request a new link.',
        'TOKEN_EXPIRED_OR_INVALID',
        400
      );
    }

    user.passwordHash = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.incrementTokenVersion();
    await user.save();

    return successResponse(
      res,
      { success: true },
      'Password has been reset successfully. You may now sign in with your new password.'
    );
  } catch (err) {
    return next(err);
  }
}

export default {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
};
