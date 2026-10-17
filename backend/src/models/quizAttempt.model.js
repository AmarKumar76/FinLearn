import mongoose from 'mongoose';

const submittedAnswerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    selectedOptionIndex: {
      type: Number,
      required: true,
    },
    isCorrect: {
      type: Boolean,
      required: true,
    },
    pointsAwarded: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const quizAttemptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Attempt must belong to an authenticated user'],
      index: true,
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: [true, 'Attempt must be associated with a quiz'],
      index: true,
    },
    attemptNumber: {
      type: Number,
      required: true,
      default: 1,
    },
    answers: [submittedAnswerSchema],
    score: {
      type: Number,
      required: true,
      default: 0,
    },
    maxScore: {
      type: Number,
      required: true,
      default: 0,
    },
    scorePercentage: {
      type: Number,
      required: true,
      default: 0,
    },
    passed: {
      type: Boolean,
      required: true,
      default: false,
    },
    xpAwarded: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'abandoned'],
      default: 'completed',
      index: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        ret.userId = ret.userId.toString();
        ret.quizId = ret.quizId.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

quizAttemptSchema.index({ userId: 1, quizId: 1, attemptNumber: 1 });
quizAttemptSchema.index({ userId: 1, completedAt: -1 });

export const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema);
export default QuizAttempt;
