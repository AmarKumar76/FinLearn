import mongoose from 'mongoose';

const materialSchema = new mongoose.Schema(
  {
    originalFilename: {
      type: String,
      required: true,
      trim: true,
    },
    storageFilename: {
      type: String,
      required: true,
      unique: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
      enum: ['application/pdf'],
    },
    fileSizeBytes: {
      type: Number,
      required: true,
      max: [20 * 1024 * 1024, 'PDF file size cannot exceed 20MB'],
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
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        if (ret.courseId) ret.courseId = ret.courseId.toString();
        if (ret.lessonId) ret.lessonId = ret.lessonId.toString();
        if (ret.uploadedBy) ret.uploadedBy = ret.uploadedBy.toString();
        delete ret.filePath; // Never expose internal filesystem storage path
        delete ret.storageFilename;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Material = mongoose.model('Material', materialSchema);
export default Material;
