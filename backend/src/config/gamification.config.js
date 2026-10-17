export const XP_CONFIG = {
  LESSON_COMPLETION: 20,
  QUIZ_ATTEMPT_MIN: 10,
  QUIZ_PASS_BONUS: 50,
  QUIZ_PERFECT_BONUS: 25,
};

export const BADGE_DEFINITIONS = [
  {
    id: 'FIRST_LESSON',
    title: 'Curious Learner',
    description: 'Completed your first financial literacy lesson',
    icon: 'BookOpen',
    category: 'learning',
  },
  {
    id: 'FIRST_QUIZ',
    title: 'Knowledge Seeker',
    description: 'Attempted your first financial assessment',
    icon: 'HelpCircle',
    category: 'assessment',
  },
  {
    id: 'QUIZ_MASTER',
    title: 'Financial Scholar',
    description: 'Passed a financial quiz with a passing score',
    icon: 'Award',
    category: 'assessment',
  },
  {
    id: 'PERFECT_SCORE',
    title: 'Sharp Mind',
    description: 'Scored 100% on a financial assessment',
    icon: 'Sparkles',
    category: 'mastery',
  },
  {
    id: 'STREAK_3_DAY',
    title: 'Consistent Saver',
    description: 'Maintained a 3-day active learning streak',
    icon: 'Flame',
    category: 'streak',
  },
  {
    id: 'STREAK_7_DAY',
    title: 'Dedicated FinLearner',
    description: 'Maintained a 7-day active learning streak',
    icon: 'Zap',
    category: 'streak',
  },
];
