import mongoose from 'mongoose';

const contributionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['deposit', 'withdrawal'],
      default: 'deposit',
    },
    amountPaise: {
      type: Number,
      required: true,
      validate: {
        validator: function (val) {
          return Number.isSafeInteger(val) && val > 0 && val <= 100000000000;
        },
        message: 'Contribution amount must be a positive safe integer in paise',
      },
    },
    date: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      trim: true,
      maxlength: [200, 'Note cannot exceed 200 characters'],
      default: '',
    },
  },
  { _id: true, timestamps: true }
);

const savingsGoalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Savings goal must belong to an authenticated user'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Goal name is required'],
      trim: true,
      minlength: [1, 'Goal name cannot be empty'],
      maxlength: [100, 'Goal name cannot exceed 100 characters'],
    },
    targetPaise: {
      type: Number,
      required: [true, 'Target amount in integer paise is required'],
      validate: {
        validator: function (val) {
          return Number.isSafeInteger(val) && val > 0 && val <= 100000000000;
        },
        message: 'Target amount must be a strictly positive safe integer in paise (max ₹100 Crore)',
      },
    },
    savedPaise: {
      type: Number,
      default: 0,
      validate: {
        validator: function (val) {
          return Number.isSafeInteger(val) && val >= 0;
        },
        message: 'Saved amount must be a non-negative safe integer in paise',
      },
    },
    targetDate: {
      type: Date,
      default: null,
    },
    category: {
      type: String,
      trim: true,
      default: 'General Savings',
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'archived'],
      default: 'in_progress',
      index: true,
    },
    history: [contributionSchema],
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

savingsGoalSchema.index({ userId: 1, status: 1 });

export const SavingsGoal = mongoose.model('SavingsGoal', savingsGoalSchema);
export default SavingsGoal;
