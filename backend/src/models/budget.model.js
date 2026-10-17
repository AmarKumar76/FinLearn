import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Budget must belong to an authenticated user'],
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Budget category is required'],
      trim: true,
    },
    period: {
      type: String,
      required: [true, 'Budget period string is required (e.g. 2026-10 or October 2026)'],
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Budget start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'Budget end date is required'],
    },
    limitPaise: {
      type: Number,
      required: [true, 'Budget limit in integer paise is required'],
      validate: {
        validator: function (val) {
          return Number.isSafeInteger(val) && val >= 0 && val <= 100000000000;
        },
        message: 'Limit must be a non-negative safe integer in paise (max ₹100 Crore)',
      },
    },
    thresholdPct: {
      type: Number,
      default: 80,
      min: [1, 'Threshold percentage must be at least 1%'],
      max: [100, 'Threshold percentage cannot exceed 100%'],
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
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

// Unique compound index preventing duplicate active budgets for the same user, category, and period
budgetSchema.index({ userId: 1, category: 1, period: 1 }, { unique: true });
budgetSchema.index({ userId: 1, startDate: 1, endDate: 1 });

export const Budget = mongoose.model('Budget', budgetSchema);
export default Budget;
