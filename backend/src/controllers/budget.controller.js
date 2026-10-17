import { Budget } from '../models/budget.model.js';
import { Transaction } from '../models/transaction.model.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

/**
 * List budgets with live spentPaise reconciliation calculated from user transactions
 * GET /api/v1/budgets
 */
export async function getBudgets(req, res, next) {
  try {
    const userId = req.user._id;
    const { period, includeArchived } = req.query;

    const query = { userId };
    if (!includeArchived || includeArchived !== 'true') {
      query.isArchived = false;
    }
    if (period) {
      query.period = period;
    }

    const budgets = await Budget.find(query).sort({ createdAt: -1 });

    // Reconcile spent amounts for each budget by aggregating actual transactions
    const populatedBudgets = await Promise.all(
      budgets.map(async (b) => {
        const spentAggregation = await Transaction.aggregate([
          {
            $match: {
              userId,
              type: 'expense',
              category: b.category,
              date: { $gte: b.startDate, $lte: b.endDate },
            },
          },
          {
            $group: {
              _id: null,
              totalSpentPaise: { $sum: '$amountPaise' },
            },
          },
        ]);

        const spentPaise = spentAggregation.length > 0 ? spentAggregation[0].totalSpentPaise : 0;
        const remainingPaise = Math.max(0, b.limitPaise - spentPaise);
        const utilizationPct =
          b.limitPaise > 0 ? Math.round((spentPaise / b.limitPaise) * 100) : 0;
        const isOverBudget = spentPaise > b.limitPaise;
        const isNearThreshold = utilizationPct >= b.thresholdPct;

        return {
          ...b.toJSON(),
          spentPaise,
          remainingPaise,
          utilizationPct,
          isOverBudget,
          isNearThreshold,
        };
      })
    );

    return successResponse(res, { budgets: populatedBudgets }, 'Budgets retrieved successfully');
  } catch (err) {
    return next(err);
  }
}

/**
 * Create a new budget
 * POST /api/v1/budgets
 */
export async function createBudget(req, res, next) {
  try {
    const { category, period, limitPaise, startDate, endDate, thresholdPct } = req.body;

    if (!category || typeof category !== 'string' || !category.trim()) {
      return errorResponse(res, 'Category is required', 'VALIDATION_ERROR', 400);
    }

    if (!period || typeof period !== 'string' || !period.trim()) {
      return errorResponse(res, 'Period is required', 'VALIDATION_ERROR', 400);
    }

    const parsedLimit = parseInt(limitPaise, 10);
    if (!Number.isSafeInteger(parsedLimit) || parsedLimit < 0) {
      return errorResponse(
        res,
        'Limit must be a non-negative safe integer in paise',
        'VALIDATION_ERROR',
        400
      );
    }

    // Default dates to current month if not explicitly passed
    const now = new Date();
    const parsedStart = startDate
      ? new Date(startDate)
      : new Date(now.getFullYear(), now.getMonth(), 1);
    const parsedEnd = endDate
      ? new Date(endDate)
      : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    if (isNaN(parsedStart.getTime()) || isNaN(parsedEnd.getTime())) {
      return errorResponse(res, 'Invalid budget start or end date', 'VALIDATION_ERROR', 400);
    }

    if (parsedStart > parsedEnd) {
      return errorResponse(res, 'Start date cannot be after end date', 'VALIDATION_ERROR', 400);
    }

    // Check for duplicate budget in the same period
    const existing = await Budget.findOne({
      userId: req.user._id,
      category: category.trim(),
      period: period.trim(),
      isArchived: false,
    });
    if (existing) {
      return errorResponse(
        res,
        `A budget for category "${category}" in period "${period}" already exists.`,
        'DUPLICATE_BUDGET',
        409
      );
    }

    const budget = new Budget({
      userId: req.user._id,
      category: category.trim(),
      period: period.trim(),
      limitPaise: parsedLimit,
      startDate: parsedStart,
      endDate: parsedEnd,
      thresholdPct: thresholdPct ? Math.min(100, Math.max(1, parseInt(thresholdPct, 10))) : 80,
    });

    await budget.save();

    return successResponse(res, { budget: budget.toJSON() }, 'Budget created successfully', 201);
  } catch (err) {
    if (err.code === 11000) {
      return errorResponse(
        res,
        'A budget for this category and period already exists',
        'DUPLICATE_BUDGET',
        409
      );
    }
    return next(err);
  }
}

/**
 * Update budget limit or threshold
 * PATCH /api/v1/budgets/:id
 */
export async function updateBudget(req, res, next) {
  try {
    const { id } = req.params;
    const { limitPaise, thresholdPct, isArchived } = req.body;

    const budget = await Budget.findOne({ _id: id, userId: req.user._id });
    if (!budget) {
      return errorResponse(res, 'Budget not found or access denied', 'NOT_FOUND', 404);
    }

    if (limitPaise !== undefined) {
      const parsedLimit = parseInt(limitPaise, 10);
      if (!Number.isSafeInteger(parsedLimit) || parsedLimit < 0) {
        return errorResponse(
          res,
          'Limit must be a non-negative safe integer in paise',
          'VALIDATION_ERROR',
          400
        );
      }
      budget.limitPaise = parsedLimit;
    }

    if (thresholdPct !== undefined) {
      budget.thresholdPct = Math.min(100, Math.max(1, parseInt(thresholdPct, 10)));
    }

    if (isArchived !== undefined) {
      budget.isArchived = Boolean(isArchived);
    }

    await budget.save();

    return successResponse(res, { budget: budget.toJSON() }, 'Budget updated successfully');
  } catch (err) {
    return next(err);
  }
}

/**
 * Delete budget
 * DELETE /api/v1/budgets/:id
 */
export async function deleteBudget(req, res, next) {
  try {
    const { id } = req.params;
    const budget = await Budget.findOneAndDelete({ _id: id, userId: req.user._id });

    if (!budget) {
      return errorResponse(res, 'Budget not found or access denied', 'NOT_FOUND', 404);
    }

    return successResponse(res, { deletedId: id }, 'Budget deleted successfully');
  } catch (err) {
    return next(err);
  }
}

export default {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
};
