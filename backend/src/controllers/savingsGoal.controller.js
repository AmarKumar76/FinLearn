import { SavingsGoal } from '../models/savingsGoal.model.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

/**
 * List all savings goals for the authenticated user
 * GET /api/v1/savings-goals
 */
export async function getSavingsGoals(req, res, next) {
  try {
    const userId = req.user._id;
    const { status } = req.query;

    const query = { userId };
    if (status && ['in_progress', 'completed', 'archived'].includes(status)) {
      query.status = status;
    } else {
      query.status = { $ne: 'archived' };
    }

    const goals = await SavingsGoal.find(query).sort({ createdAt: -1 });

    const decorated = goals.map((g) => {
      const remainingPaise = Math.max(0, g.targetPaise - g.savedPaise);
      const progressPct =
        g.targetPaise > 0 ? Math.min(100, Math.round((g.savedPaise / g.targetPaise) * 100)) : 0;
      return {
        ...g.toJSON(),
        remainingPaise,
        progressPct,
      };
    });

    return successResponse(res, { goals: decorated }, 'Savings goals retrieved');
  } catch (err) {
    return next(err);
  }
}

/**
 * Create a new savings goal
 * POST /api/v1/savings-goals
 */
export async function createSavingsGoal(req, res, next) {
  try {
    const { name, targetPaise, targetDate, category, initialDepositPaise } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return errorResponse(res, 'Goal name is required', 'VALIDATION_ERROR', 400);
    }

    const parsedTarget = parseInt(targetPaise, 10);
    if (!Number.isSafeInteger(parsedTarget) || parsedTarget <= 0) {
      return errorResponse(
        res,
        'Target amount must be a strictly positive safe integer in paise',
        'VALIDATION_ERROR',
        400
      );
    }

    let parsedDate = null;
    if (targetDate) {
      parsedDate = new Date(targetDate);
      if (isNaN(parsedDate.getTime())) {
        return errorResponse(res, 'Invalid target date', 'VALIDATION_ERROR', 400);
      }
    }

    const goal = new SavingsGoal({
      userId: req.user._id,
      name: name.trim(),
      targetPaise: parsedTarget,
      targetDate: parsedDate,
      category: typeof category === 'string' && category.trim() ? category.trim() : 'General Savings',
      savedPaise: 0,
      history: [],
    });

    // Optional initial deposit
    if (initialDepositPaise) {
      const parsedDeposit = parseInt(initialDepositPaise, 10);
      if (Number.isSafeInteger(parsedDeposit) && parsedDeposit > 0) {
        goal.savedPaise = parsedDeposit;
        goal.history.push({
          type: 'deposit',
          amountPaise: parsedDeposit,
          date: new Date(),
          note: 'Initial deposit',
        });
        if (goal.savedPaise >= goal.targetPaise) {
          goal.status = 'completed';
        }
      }
    }

    await goal.save();

    return successResponse(res, { goal: goal.toJSON() }, 'Savings goal created', 201);
  } catch (err) {
    return next(err);
  }
}

/**
 * Add a contribution or record a withdrawal
 * POST /api/v1/savings-goals/:id/contributions
 */
export async function addContribution(req, res, next) {
  try {
    const { id } = req.params;
    const { type = 'deposit', amountPaise, note } = req.body;

    const goal = await SavingsGoal.findOne({ _id: id, userId: req.user._id });
    if (!goal) {
      return errorResponse(res, 'Savings goal not found or access denied', 'NOT_FOUND', 404);
    }

    if (!['deposit', 'withdrawal'].includes(type)) {
      return errorResponse(res, 'Type must be "deposit" or "withdrawal"', 'VALIDATION_ERROR', 400);
    }

    const parsedAmount = parseInt(amountPaise, 10);
    if (!Number.isSafeInteger(parsedAmount) || parsedAmount <= 0) {
      return errorResponse(
        res,
        'Amount must be a strictly positive safe integer in paise',
        'VALIDATION_ERROR',
        400
      );
    }

    if (type === 'withdrawal') {
      if (parsedAmount > goal.savedPaise) {
        return errorResponse(
          res,
          `Withdrawal amount exceeds current saved balance (${goal.savedPaise} paise available)`,
          'INSUFFICIENT_FUNDS',
          400
        );
      }
      goal.savedPaise -= parsedAmount;
      if (goal.status === 'completed' && goal.savedPaise < goal.targetPaise) {
        goal.status = 'in_progress';
      }
    } else {
      goal.savedPaise += parsedAmount;
      if (goal.savedPaise >= goal.targetPaise) {
        goal.status = 'completed';
      }
    }

    goal.history.push({
      type,
      amountPaise: parsedAmount,
      date: new Date(),
      note: typeof note === 'string' ? note.trim() : '',
    });

    await goal.save();

    return successResponse(
      res,
      {
        goal: goal.toJSON(),
        savedPaise: goal.savedPaise,
        status: goal.status,
      },
      `${type === 'deposit' ? 'Contribution added' : 'Withdrawal recorded'} successfully`
    );
  } catch (err) {
    return next(err);
  }
}

/**
 * Archive savings goal
 * PATCH /api/v1/savings-goals/:id/archive
 */
export async function archiveSavingsGoal(req, res, next) {
  try {
    const { id } = req.params;
    const goal = await SavingsGoal.findOne({ _id: id, userId: req.user._id });
    if (!goal) {
      return errorResponse(res, 'Savings goal not found or access denied', 'NOT_FOUND', 404);
    }

    goal.status = 'archived';
    await goal.save();

    return successResponse(res, { goal: goal.toJSON() }, 'Savings goal archived');
  } catch (err) {
    return next(err);
  }
}

export default {
  getSavingsGoals,
  createSavingsGoal,
  addContribution,
  archiveSavingsGoal,
};
