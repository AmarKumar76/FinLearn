import mongoose from 'mongoose';

export const SOURCE_CATEGORIES = [
  'Cyber Safety & Scam Protection',
  'Lending & Borrowing Regulations',
  'Investment & Securities Education',
  'Banking & Payment Systems',
  'Consumer Protection & Grievance',
];

const sourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Source title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    organization: {
      type: String,
      required: [true, 'Publishing organization is required'],
      trim: true,
      maxlength: [150, 'Organization cannot exceed 150 characters'],
    },
    url: {
      type: String,
      required: [true, 'Official source URL is required'],
      trim: true,
      match: [/^https?:\/\/.+/, 'URL must be a valid HTTP/HTTPS link'],
    },
    category: {
      type: String,
      enum: SOURCE_CATEGORIES,
      required: [true, 'Category is required'],
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    lastReviewedDate: {
      type: String, // 'YYYY-MM-DD'
      required: [true, 'Last reviewed date is required'],
    },
    reviewStatus: {
      type: String,
      enum: ['verified', 'needs_review', 'deprecated'],
      default: 'verified',
      index: true,
    },
    sourceType: {
      type: String,
      enum: ['regulator', 'bank', 'payment_network', 'enforcement', 'other'],
      default: 'regulator',
      index: true,
    },
    domains: {
      type: [String],
      default: [],
      index: true,
    },
    threatIndicators: {
      type: [String],
      default: [],
    },
    lastCheckedAt: {
      type: Date,
      default: Date.now,
    },
    retrievalStatus: {
      type: String,
      enum: ['available', 'cached', 'degraded', 'unavailable'],
      default: 'available',
    },
    errorDetails: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

sourceSchema.index({ category: 1, reviewStatus: 1 });

export const Source = mongoose.model('Source', sourceSchema);
export default Source;
