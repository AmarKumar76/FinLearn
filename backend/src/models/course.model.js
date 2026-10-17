import mongoose from 'mongoose';

export const COURSE_CATEGORIES = [
  'Budgeting',
  'Savings & Emergency Funds',
  'Loans & EMI',
  'Banking & Digital Safety',
  'Investments',
  'Insurance Basics',
  'Financial Scams',
];

export const DIFFICULTY_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      minlength: [3, 'Course title must be at least 3 characters'],
      maxlength: [150, 'Course title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Course description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    category: {
      type: String,
      enum: COURSE_CATEGORIES,
      required: [true, 'Category is required'],
      index: true,
    },
    difficulty: {
      type: String,
      enum: DIFFICULTY_LEVELS,
      default: 'Beginner',
    },
    language: {
      type: String,
      default: 'en',
      enum: ['en', 'hi'],
    },
    learningObjectives: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
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
        ret.createdBy = ret.createdBy ? ret.createdBy.toString() : null;
        if (ret.updatedBy) ret.updatedBy = ret.updatedBy.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

courseSchema.index({ status: 1, category: 1 });

export const Course = mongoose.model('Course', courseSchema);
export default Course;
