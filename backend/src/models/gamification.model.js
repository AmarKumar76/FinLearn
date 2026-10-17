import mongoose from 'mongoose';

const gamificationProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    totalXp: {
      type: Number,
      default: 0,
      min: 0,
    },
    currentStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastActivityDate: {
      type: String, // 'YYYY-MM-DD' formatted in Asia/Kolkata timezone
      default: null,
    },
    earnedBadges: [
      {
        badgeId: { type: String, required: true },
        earnedAt: { type: Date, default: Date.now },
      },
    ],
    completedQuizzesCount: {
      type: Number,
      default: 0,
    },
    passedQuizzesCount: {
      type: Number,
      default: 0,
    },
    completedLessonsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        ret.userId = ret.userId.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const GamificationProfile = mongoose.model(
  'GamificationProfile',
  gamificationProfileSchema
);
export default GamificationProfile;
