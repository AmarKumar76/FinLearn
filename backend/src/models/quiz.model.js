import mongoose from 'mongoose';
import { COURSE_CATEGORIES, DIFFICULTY_LEVELS } from './course.model.js';

const questionSchema = new mongoose.Schema(
  {
    questionText: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
      minlength: [5, 'Question text must be at least 5 characters'],
      maxlength: [500, 'Question text cannot exceed 500 characters'],
    },
    questionType: {
      type: String,
      enum: ['mcq', 'true_false'],
      default: 'mcq',
      required: true,
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: function (val) {
          if (this.questionType === 'true_false') {
            return Array.isArray(val) && val.length === 2;
          }
          return Array.isArray(val) && val.length >= 2 && val.length <= 6;
        },
        message: 'MCQ questions must have between 2 and 6 options, True/False must have 2 options',
      },
    },
    correctAnswerIndex: {
      type: Number,
      required: [true, 'Correct answer index is required'],
      min: 0,
      select: false, // Invariant: Never select or leak correct answers in general queries
    },
    explanation: {
      type: String,
      default: '',
      trim: true,
      maxlength: [1000, 'Explanation cannot exceed 1000 characters'],
      select: false, // Invariant: Hidden before attempt submission
    },
    points: {
      type: Number,
      default: 10,
      min: [1, 'Points must be at least 1'],
      max: [100, 'Points cannot exceed 100'],
    },
    topic: {
      type: String,
      default: 'General',
      trim: true,
    },
  },
  {
    _id: true,
    timestamps: false,
  }
);

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Quiz title is required'],
      trim: true,
      minlength: [3, 'Quiz title must be at least 3 characters'],
      maxlength: [150, 'Quiz title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Quiz description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    category: {
      type: String,
      enum: COURSE_CATEGORIES,
      default: 'Budgeting',
      index: true,
    },
    difficulty: {
      type: String,
      enum: DIFFICULTY_LEVELS,
      default: 'Beginner',
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      default: null,
      index: true,
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      default: null,
      index: true,
    },
    passingScorePercent: {
      type: Number,
      default: 60,
      min: [1, 'Passing score must be at least 1%'],
      max: [100, 'Passing score cannot exceed 100%'],
    },
    timeLimitMinutes: {
      type: Number,
      default: 0, // 0 = no time limit
      min: [0, 'Time limit cannot be negative'],
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    isAiGenerated: {
      type: Boolean,
      default: false,
    },
    isPractice: {
      type: Boolean,
      default: false,
      index: true,
    },
    aiReviewStatus: {
      type: String,
      enum: ['not_applicable', 'pending_human_review', 'approved', 'rejected'],
      default: 'not_applicable',
    },
    questions: [questionSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        if (ret.courseId) ret.courseId = ret.courseId.toString();
        if (ret.lessonId) ret.lessonId = ret.lessonId.toString();
        ret.createdBy = ret.createdBy ? ret.createdBy.toString() : null;
        if (ret.updatedBy) ret.updatedBy = ret.updatedBy.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

quizSchema.index({ status: 1, courseId: 1 });
quizSchema.index({ status: 1, category: 1 });

export const Quiz = mongoose.model('Quiz', quizSchema);
export default Quiz;
