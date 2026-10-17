import mongoose from 'mongoose';

export const COMMITMENT_TYPES = [
  'EMI',
  'SIP',
  'Rent',
  'Insurance Premium',
  'Utility Bill',
  'Subscription',
  'Education Fee',
  'Credit Card',
  'Custom',
];

export const RECURRENCE_RULES = [
  'One-time',
  'Monthly',
  'Quarterly',
  'Annually',
];

const paymentRecordSchema = new mongoose.Schema(
  {
    paidDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    amountPaise: {
      type: Number,
      required: true,
      validate: {
        validator: function (val) {
          return Number.isSafeInteger(val) && val > 0;
        },
        message: 'Paid amount must be a positive integer in paise',
      },
    },
    idempotencyKey: {
      type: String,
      sparse: true,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    isUserReported: {
      type: Boolean,
      default: true, // Reminder: Manually recorded by user; NOT bank-confirmed
    },
  },
  { _id: true, timestamps: true }
);

const commitmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Commitment must belong to an authenticated user'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Commitment title/name is required'],
      trim: true,
      minlength: [1, 'Title cannot be empty'],
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    type: {
      type: String,
      enum: COMMITMENT_TYPES,
      default: 'EMI',
      required: true,
      index: true,
    },
    amountPaise: {
      type: Number,
      required: [true, 'Amount in integer paise is required'],
      validate: {
        validator: function (val) {
          return Number.isSafeInteger(val) && val > 0 && val <= 100000000000;
        },
        message: 'Amount must be a positive safe integer in paise (max ₹100 Crore)',
      },
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
      index: true,
    },
    recurrence: {
      type: String,
      enum: RECURRENCE_RULES,
      default: 'Monthly',
      required: true,
    },
    endDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['Scheduled', 'Paid', 'Archived'],
      default: 'Scheduled',
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: '',
    },
    paymentHistory: [paymentRecordSchema],
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

commitmentSchema.index({ userId: 1, dueDate: 1 });
commitmentSchema.index({ userId: 1, status: 1 });

export const Commitment = mongoose.model('Commitment', commitmentSchema);
export default Commitment;
