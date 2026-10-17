import mongoose from 'mongoose';

export const TRANSACTION_CATEGORIES = [
  'Food & Groceries',
  'Housing & Rent',
  'Utilities & Bills',
  'Transportation',
  'Shopping & Essentials',
  'Healthcare & Medical',
  'Education & Courses',
  'Entertainment & Leisure',
  'Salary & Wages',
  'Freelance & Consulting',
  'Investments & Dividends',
  'Gifts & Grants',
  'Other Expense',
  'Other Income',
];

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Transaction must belong to an authenticated user'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Transaction title is required'],
      trim: true,
      minlength: [1, 'Title cannot be empty'],
      maxlength: [140, 'Title cannot exceed 140 characters'],
    },
    type: {
      type: String,
      enum: {
        values: ['income', 'expense'],
        message: '{VALUE} is not a valid transaction type',
      },
      required: [true, 'Transaction type (income/expense) is required'],
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Transaction category is required'],
      trim: true,
      index: true,
    },
    amountPaise: {
      type: Number,
      required: [true, 'Amount in integer paise is required'],
      validate: {
        validator: function (val) {
          // Strictly positive safe integer
          return Number.isSafeInteger(val) && val > 0 && val <= 100000000000; // max ₹100 Crore
        },
        message: 'Amount must be a strictly positive safe integer in paise (max ₹100 Crore)',
      },
    },
    date: {
      type: Date,
      required: [true, 'Transaction date is required'],
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
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

// Compound indexes for performant filtered, sorted, paginated queries
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, type: 1, date: -1 });
transactionSchema.index({ userId: 1, category: 1, date: -1 });

export const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;
