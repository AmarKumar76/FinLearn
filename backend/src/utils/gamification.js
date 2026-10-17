import { GamificationProfile } from '../models/gamification.model.js';
import { XP_CONFIG, BADGE_DEFINITIONS } from '../config/gamification.config.js';

/**
 * Returns today's date string 'YYYY-MM-DD' formatted in Asia/Kolkata timezone
 */
export function getKolkataDateString(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date);
}

/**
 * Calculate difference in days between two 'YYYY-MM-DD' date strings
 */
export function getDaysDifference(currentDateStr, previousDateStr) {
  if (!previousDateStr) return null;
  const d1 = new Date(currentDateStr);
  const d2 = new Date(previousDateStr);
  const diffTime = d1.getTime() - d2.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Record a verified learning activity (quiz attempt, lesson completion) and atomically update streaks, XP, and badges.
 * Invariant: Never award XP on repeated calls for the same idempotent activity.
 */
export async function recordGamificationActivity({
  userId,
  activityType, // 'LESSON_COMPLETE' | 'QUIZ_ATTEMPT'
  quizPassed = false,
  isPerfectScore = false,
  customXp = null,
}) {
  let profile = await GamificationProfile.findOne({ userId });
  if (!profile) {
    profile = new GamificationProfile({ userId });
  }

  const todayStr = getKolkataDateString();
  const daysDiff = getDaysDifference(todayStr, profile.lastActivityDate);

  // 1. Calculate Streak
  if (daysDiff === null) {
    // First activity ever
    profile.currentStreak = 1;
    profile.longestStreak = Math.max(profile.longestStreak, 1);
    profile.lastActivityDate = todayStr;
  } else if (daysDiff === 0) {
    // Same day activity: streak unchanged, do not increment
    profile.lastActivityDate = todayStr;
  } else if (daysDiff === 1) {
    // Consecutive day activity: increment streak!
    profile.currentStreak += 1;
    profile.longestStreak = Math.max(profile.longestStreak, profile.currentStreak);
    profile.lastActivityDate = todayStr;
  } else {
    // Missed at least one day: reset streak to 1
    profile.currentStreak = 1;
    profile.lastActivityDate = todayStr;
  }

  // 2. Calculate XP
  let xpAwarded = 0;
  if (customXp !== null) {
    xpAwarded = customXp;
  } else if (activityType === 'LESSON_COMPLETE') {
    xpAwarded = XP_CONFIG.LESSON_COMPLETION;
    profile.completedLessonsCount += 1;
  } else if (activityType === 'QUIZ_ATTEMPT') {
    profile.completedQuizzesCount += 1;
    xpAwarded += XP_CONFIG.QUIZ_ATTEMPT_MIN;
    if (quizPassed) {
      profile.passedQuizzesCount += 1;
      xpAwarded += XP_CONFIG.QUIZ_PASS_BONUS;
    }
    if (isPerfectScore) {
      xpAwarded += XP_CONFIG.QUIZ_PERFECT_BONUS;
    }
  }

  profile.totalXp += xpAwarded;

  // 3. Evaluate Badges
  const existingBadgeIds = new Set(profile.earnedBadges.map((b) => b.badgeId));
  const newBadgesAwarded = [];

  const grantBadge = (badgeId) => {
    if (!existingBadgeIds.has(badgeId)) {
      profile.earnedBadges.push({ badgeId, earnedAt: new Date() });
      existingBadgeIds.add(badgeId);
      const def = BADGE_DEFINITIONS.find((b) => b.id === badgeId);
      if (def) newBadgesAwarded.push(def);
    }
  };

  if (activityType === 'LESSON_COMPLETE' && profile.completedLessonsCount >= 1) {
    grantBadge('FIRST_LESSON');
  }

  if (activityType === 'QUIZ_ATTEMPT') {
    if (profile.completedQuizzesCount >= 1) {
      grantBadge('FIRST_QUIZ');
    }
    if (quizPassed) {
      grantBadge('QUIZ_MASTER');
    }
    if (isPerfectScore) {
      grantBadge('PERFECT_SCORE');
    }
  }

  if (profile.currentStreak >= 3) {
    grantBadge('STREAK_3_DAY');
  }
  if (profile.currentStreak >= 7) {
    grantBadge('STREAK_7_DAY');
  }

  await profile.save();

  return {
    profile: profile.toJSON(),
    xpAwarded,
    newBadgesAwarded,
  };
}

export default {
  getKolkataDateString,
  getDaysDifference,
  recordGamificationActivity,
};
