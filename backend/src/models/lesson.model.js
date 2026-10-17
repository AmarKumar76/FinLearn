import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Lesson must belong to a course'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Lesson title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    content: {
      type: String,
      required: [true, 'Lesson content is required'],
      default: '',
    },
    order: {
      type: Number,
      required: [true, 'Lesson order is required'],
      default: 1,
    },
    durationMinutes: {
      type: Number,
      default: 5,
      min: [1, 'Duration must be at least 1 minute'],
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    sourceCitations: {
      type: [String],
      default: [],
    },
    materialIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Material',
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        ret.courseId = ret.courseId.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

lessonSchema.index({ courseId: 1, order: 1 });
lessonSchema.index({ courseId: 1, status: 1 });

export const Lesson = mongoose.model('Lesson', lessonSchema);
export default Lesson;
