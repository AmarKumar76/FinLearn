import { Transaction } from '../models/transaction.model.js';
import { Budget } from '../models/budget.model.js';
import { SavingsGoal } from '../models/savingsGoal.model.js';
import { Commitment } from '../models/commitment.model.js';
import { GamificationProfile } from '../models/gamification.model.js';
import { successResponse } from '../utils/apiResponse.js';

/**
 * Get unified financial dashboard summary strictly aggregated from the authenticated user's records
 * GET /api/v1/dashboard/summary
 */
export async function getDashboardSummary(req, res, next) {
  try {
    const userId = req.user._id;
    const { startDate, endDate, period } = req.query;

    // Date range setup
    let start;
    let end;
    const now = new Date();

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      // Default to current month
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    // 1. Transaction Aggregations (Income, Expense, Net)
    const [txSummary, recentTransactions, gamificationProfile] = await Promise.all([
      Transaction.aggregate([
        {
          $match: {
            userId,
            date: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: '$type',
            totalPaise: { $sum: '$amountPaise' },
            count: { $sum: 1 },
          },
        },
      ]),
      Transaction.find({ userId })
        .sort({ date: -1, _id: -1 })
        .limit(5),
      GamificationProfile.findOne({ userId }),
    ]);

    let totalIncomePaise = 0;
    let totalExpensePaise = 0;

    txSummary.forEach((group) => {
      if (group._id === 'income') {
        totalIncomePaise = group.totalPaise;
      } else if (group._id === 'expense') {
        totalExpensePaise = group.totalPaise;
      }
    });

    const netCashFlowPaise = totalIncomePaise - totalExpensePaise;

    // 2. Active Budgets for the period
    const budgetQuery = { userId, isArchived: false };
    if (period) {
      budgetQuery.period = period;
    }
    const budgets = await Budget.find(budgetQuery);

    const populatedBudgets = await Promise.all(
      budgets.map(async (b) => {
        const spentAgg = await Transaction.aggregate([
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
              spent: { $sum: '$amountPaise' },
            },
          },
        ]);
        const spentPaise = spentAgg.length > 0 ? spentAgg[0].spent : 0;
        const utilizationPct = b.limitPaise > 0 ? Math.round((spentPaise / b.limitPaise) * 100) : 0;
        return {
          ...b.toJSON(),
          spentPaise,
          utilizationPct,
        };
      })
    );

    // 3. Active Savings Goals
    const savingsGoals = await SavingsGoal.find({
      userId,
      status: { $ne: 'archived' },
    }).sort({ createdAt: -1 });

    const totalTargetSavingsPaise = savingsGoals.reduce((acc, g) => acc + g.targetPaise, 0);
    const totalSavedPaise = savingsGoals.reduce((acc, g) => acc + g.savedPaise, 0);

    // 4. Commitments (Upcoming, Due Today, Overdue)
    now.setHours(0, 0, 0, 0);
    const commitments = await Commitment.find({
      userId,
      status: 'Scheduled',
    }).sort({ dueDate: 1 });

    const upcomingCommitments = [];
    const overdueCommitments = [];

    commitments.forEach((c) => {
      const due = new Date(c.dueDate);
      due.setHours(0, 0, 0, 0);
      if (due < now) {
        overdueCommitments.push(c.toJSON());
      } else {
        upcomingCommitments.push(c.toJSON());
      }
    });

    return successResponse(
      res,
      {
        reportingPeriod: {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        },
        financials: {
          totalIncomePaise,
          totalExpensePaise,
          netCashFlowPaise,
          savingsRatePct:
            totalIncomePaise > 0
              ? Math.max(0, Math.round(((totalIncomePaise - totalExpensePaise) / totalIncomePaise) * 100))
              : 0,
        },
        budgets: populatedBudgets,
        savingsGoals: savingsGoals.map((g) => ({
          ...g.toJSON(),
          progressPct: g.targetPaise > 0 ? Math.round((g.savedPaise / g.targetPaise) * 100) : 0,
        })),
        savingsSummary: {
          totalTargetSavingsPaise,
          totalSavedPaise,
          overallProgressPct:
            totalTargetSavingsPaise > 0
              ? Math.round((totalSavedPaise / totalTargetSavingsPaise) * 100)
              : 0,
        },
        commitments: {
          upcoming: upcomingCommitments,
          overdue: overdueCommitments,
          totalUpcomingCount: upcomingCommitments.length,
          totalOverdueCount: overdueCommitments.length,
        },
        recentTransactions: recentTransactions.map((t) => t.toJSON()),
        gamification: {
          totalXp: gamificationProfile?.totalXp || 0,
          currentStreak: gamificationProfile?.currentStreak || 0,
          longestStreak: gamificationProfile?.longestStreak || 0,
          earnedBadgesCount: gamificationProfile?.earnedBadges?.length || 0,
          passedQuizzesCount: gamificationProfile?.passedQuizzesCount || 0,
        },
      },
      'Dashboard financial summary retrieved'
    );
  } catch (err) {
    return next(err);
  }
}

export default {
  getDashboardSummary,
};
