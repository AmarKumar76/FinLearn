import { User } from '../models/user.model.js';
import { GamificationProfile } from '../models/gamification.model.js';
import { BADGE_DEFINITIONS } from '../config/gamification.config.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

/**
 * Get current authenticated user's full profile including gamification stats
 * GET /api/v1/users/me/profile
 */
export async function getMyProfile(req, res, next) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return errorResponse(res, 'User not found', 'NOT_FOUND', 404);
    }

    let gamification = await GamificationProfile.findOne({ userId: user._id });
    if (!gamification) {
      gamification = new GamificationProfile({ userId: user._id });
      await gamification.save();
    }

    const earnedSet = new Set((gamification.earnedBadges || []).map((b) => b.badgeId));
    const allBadges = BADGE_DEFINITIONS.map((b) => ({
      ...b,
      isEarned: earnedSet.has(b.id),
      earnedAt: gamification.earnedBadges.find((eb) => eb.badgeId === b.id)?.earnedAt || null,
    }));

    return successResponse(
      res,
      {
        user: user.toJSON(),
        gamification: {
          profile: gamification.toJSON(),
          badges: allBadges,
        },
      },
      'Personal profile retrieved'
    );
  } catch (err) {
    return next(err);
  }
}

/**
 * Update current authenticated user's profile and preferences
 * PATCH /api/v1/users/me/profile
 */
export async function updateMyProfile(req, res, next) {
  try {
    const { name, username, bio, isProfilePublic, preferences } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return errorResponse(res, 'User not found', 'NOT_FOUND', 404);
    }

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
      return errorResponse(res, 'Username is already taken', 'DUPLICATE_USERNAME', 409);
    }
    return next(err);
  }
}

/**
 * Get public profile by username
 * Respects user's privacy preference (isProfilePublic).
 * Never leaks email, passwords, reset tokens, or private finances.
 * GET /api/v1/users/profile/:username
 */
export async function getPublicProfile(req, res, next) {
  try {
    const rawUsername = req.params.username;
    if (!rawUsername) {
      return errorResponse(res, 'Username is required', 'VALIDATION_ERROR', 400);
    }

    const cleanUsername = rawUsername.trim().toLowerCase();
    const targetUser = await User.findOne({ username: cleanUsername });

    if (!targetUser) {
      return errorResponse(res, 'Profile not found', 'NOT_FOUND', 404);
    }

    // Check if requester is the user themselves
    const isOwner = req.user && req.user._id.toString() === targetUser._id.toString();

    // If profile is private and requester is not the owner
    if (!targetUser.isProfilePublic && !isOwner) {
      return successResponse(
        res,
        {
          user: {
            username: targetUser.username,
            name: 'Private Learner',
            bio: '',
            isProfilePublic: false,
          },
          isPrivate: true,
          gamification: null,
        },
        'User profile is private'
      );
    }

    // Load gamification data
    const gamification = await GamificationProfile.findOne({ userId: targetUser._id });
    let earnedBadges = [];
    if (gamification && gamification.earnedBadges) {
      const earnedSet = new Set(gamification.earnedBadges.map((b) => b.badgeId));
      earnedBadges = BADGE_DEFINITIONS.filter((b) => earnedSet.has(b.id)).map((b) => ({
        ...b,
        isEarned: true,
        earnedAt: gamification.earnedBadges.find((eb) => eb.badgeId === b.id)?.earnedAt || null,
      }));
    }

    return successResponse(
      res,
      {
        user: {
          id: targetUser._id.toString(),
          name: targetUser.name,
          username: targetUser.username,
          bio: targetUser.bio || '',
          createdAt: targetUser.createdAt,
          isProfilePublic: targetUser.isProfilePublic,
        },
        isPrivate: false,
        gamification: {
          profile: gamification
            ? {
                totalXp: gamification.totalXp,
                currentStreak: gamification.currentStreak,
                longestStreak: gamification.longestStreak,
                completedLessonsCount: gamification.completedLessonsCount,
                passedQuizzesCount: gamification.passedQuizzesCount,
              }
            : {
                totalXp: 0,
                currentStreak: 0,
                longestStreak: 0,
                completedLessonsCount: 0,
                passedQuizzesCount: 0,
              },
          badges: earnedBadges,
        },
      },
      'Public profile retrieved'
    );
  } catch (err) {
    return next(err);
  }
}
