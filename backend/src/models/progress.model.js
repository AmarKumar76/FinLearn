import mongoose from 'mongoose';

const learnerProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Progress must belong to an authenticated user'],
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true,
      index: true,
    },
    isCompleted: {
      type: Boolean,
      default: true,
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
        ret.courseId = ret.courseId.toString();
        ret.lessonId = ret.lessonId.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Prevent duplicate progress records for the same user and lesson
learnerProgressSchema.index({ userId: 1, lessonId: 1 }, { unique: true });
learnerProgressSchema.index({ userId: 1, courseId: 1 });

export const LearnerProgress = mongoose.model('LearnerProgress', learnerProgressSchema);
export default LearnerProgress;
