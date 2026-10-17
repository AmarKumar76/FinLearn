import { Transaction } from '../models/transaction.model.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

/**
 * List transactions for the authenticated user with search, filter, sort, and pagination
 * GET /api/v1/transactions
 */
export async function getTransactions(req, res, next) {
  try {
    const userId = req.user._id;
    const {
      type,
      category,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 20,
      sortBy = 'date',
      sortOrder = 'desc',
    } = req.query;

    const query = { userId };

    if (type && ['income', 'expense'].includes(type)) {
      query.type = type;
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        const start = new Date(startDate);
        if (!isNaN(start.getTime())) {
          query.date.$gte = start;
        }
      }
      if (endDate) {
        const end = new Date(endDate);
        if (!isNaN(end.getTime())) {
          query.date.$lte = end;
        }
      }
    }

    if (search && typeof search === 'string' && search.trim()) {
      // Safe regex without ReDoS or NoSQL injection
      const sanitized = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { title: { $regex: sanitized, $options: 'i' } },
        { description: { $regex: sanitized, $options: 'i' } },
        { category: { $regex: sanitized, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;
    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    const [transactions, totalCount] = await Promise.all([
      Transaction.find(query)
        .sort({ [sortBy]: sortDirection, _id: -1 })
        .skip(skip)
        .limit(limitNum),
      Transaction.countDocuments(query),
    ]);

    return successResponse(
      res,
      {
        transactions: transactions.map((t) => t.toJSON()),
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalCount,
          totalPages: Math.ceil(totalCount / limitNum),
        },
      },
      'Transactions retrieved successfully'
    );
  } catch (err) {
    return next(err);
  }
}

/**
 * Get single transaction with ownership verification
 * GET /api/v1/transactions/:id
 */
export async function getTransactionById(req, res, next) {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findOne({ _id: id, userId: req.user._id });

    if (!transaction) {
      return errorResponse(res, 'Transaction not found or access denied', 'NOT_FOUND', 404);
    }

    return successResponse(res, { transaction: transaction.toJSON() }, 'Transaction retrieved');
  } catch (err) {
    return next(err);
  }
}

/**
 * Create income or expense record
 * POST /api/v1/transactions
 */
export async function createTransaction(req, res, next) {
  try {
    const { title, type, category, amountPaise, date, description } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return errorResponse(res, 'Transaction title is required', 'VALIDATION_ERROR', 400);
    }

    if (!['income', 'expense'].includes(type)) {
      return errorResponse(res, 'Type must be either "income" or "expense"', 'VALIDATION_ERROR', 400);
    }

    if (!category || typeof category !== 'string' || !category.trim()) {
      return errorResponse(res, 'Category is required', 'VALIDATION_ERROR', 400);
    }

    if (
      typeof amountPaise !== 'number' ||
      !Number.isSafeInteger(amountPaise) ||
      amountPaise <= 0
    ) {
      return errorResponse(
        res,
        'Amount must be a strictly positive safe integer in paise',
        'VALIDATION_ERROR',
        400
      );
    }
    const parsedPaise = amountPaise;

    const parsedDate = date ? new Date(date) : new Date();
    if (isNaN(parsedDate.getTime())) {
      return errorResponse(res, 'Invalid transaction date', 'VALIDATION_ERROR', 400);
    }

    const transaction = new Transaction({
      userId: req.user._id,
      title: title.trim(),
      type,
      category: category.trim(),
      amountPaise: parsedPaise,
      date: parsedDate,
      description: typeof description === 'string' ? description.trim() : '',
    });

    await transaction.save();

    return successResponse(
      res,
      { transaction: transaction.toJSON() },
      'Transaction created successfully',
      201
    );
  } catch (err) {
    return next(err);
  }
}

/**
 * Update existing transaction with ownership check
 * PATCH /api/v1/transactions/:id
 */
export async function updateTransaction(req, res, next) {
  try {
    const { id } = req.params;
    const { title, type, category, amountPaise, date, description } = req.body;

    const transaction = await Transaction.findOne({ _id: id, userId: req.user._id });
    if (!transaction) {
      return errorResponse(res, 'Transaction not found or access denied', 'NOT_FOUND', 404);
    }

    if (title !== undefined) {
      if (typeof title !== 'string' || !title.trim()) {
        return errorResponse(res, 'Title cannot be empty', 'VALIDATION_ERROR', 400);
      }
      transaction.title = title.trim();
    }

    if (type !== undefined) {
      if (!['income', 'expense'].includes(type)) {
        return errorResponse(res, 'Type must be "income" or "expense"', 'VALIDATION_ERROR', 400);
      }
      transaction.type = type;
    }

    if (category !== undefined) {
      if (typeof category !== 'string' || !category.trim()) {
        return errorResponse(res, 'Category cannot be empty', 'VALIDATION_ERROR', 400);
      }
      transaction.category = category.trim();
    }

    if (amountPaise !== undefined) {
      const parsedPaise = parseInt(amountPaise, 10);
      if (!Number.isSafeInteger(parsedPaise) || parsedPaise <= 0) {
        return errorResponse(
          res,
          'Amount must be a strictly positive safe integer in paise',
          'VALIDATION_ERROR',
          400
        );
      }
      transaction.amountPaise = parsedPaise;
    }

    if (date !== undefined) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return errorResponse(res, 'Invalid transaction date', 'VALIDATION_ERROR', 400);
      }
      transaction.date = parsedDate;
    }

    if (description !== undefined) {
      transaction.description = typeof description === 'string' ? description.trim() : '';
    }

    await transaction.save();

    return successResponse(
      res,
      { transaction: transaction.toJSON() },
      'Transaction updated successfully'
    );
  } catch (err) {
    return next(err);
  }
}

/**
 * Delete transaction with ownership check
 * DELETE /api/v1/transactions/:id
 */
export async function deleteTransaction(req, res, next) {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findOneAndDelete({ _id: id, userId: req.user._id });

    if (!transaction) {
      return errorResponse(res, 'Transaction not found or access denied', 'NOT_FOUND', 404);
    }

    return successResponse(
      res,
      { deletedId: id },
      'Transaction deleted successfully'
    );
  } catch (err) {
    return next(err);
  }
}

export default {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
