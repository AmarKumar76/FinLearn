import mongoose from 'mongoose';
import { Transaction } from '../models/transaction.model.js';
import { Budget } from '../models/budget.model.js';
import { SavingsGoal } from '../models/savingsGoal.model.js';
import { Commitment } from '../models/commitment.model.js';
import { LearnerProgress } from '../models/progress.model.js';
import { QuizAttempt } from '../models/quizAttempt.model.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

/**
 * Get comprehensive user-scoped financial insights and reconciled reports
 * GET /api/v1/insights
 */
export async function getUserInsights(req, res, next) {
  try {
    const userId = req.user._id;
    const { startDate, endDate } = req.query;

    const dateFilter = { userId };
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) {
        const start = new Date(startDate);
        if (!isNaN(start.getTime())) {
          dateFilter.date.$gte = start;
        }
      }
      if (endDate) {
        const end = new Date(endDate);
        if (!isNaN(end.getTime())) {
          dateFilter.date.$lte = end;
        }
      }
    }

    // 1. Transactions Aggregation
    const transactions = await Transaction.find(dateFilter).sort({ date: -1 });

    let totalIncomePaise = 0;
    let totalExpensePaise = 0;
    const categoryExpenseMap = new Map();

    transactions.forEach((t) => {
      if (t.type === 'income') {
        totalIncomePaise += t.amountPaise;
      } else if (t.type === 'expense') {
        totalExpensePaise += t.amountPaise;
        const cat = t.category || 'Other';
        categoryExpenseMap.set(cat, (categoryExpenseMap.get(cat) || 0) + t.amountPaise);
      }
    });

    const netSavingsPaise = totalIncomePaise - totalExpensePaise;
    const savingsRatePercent = totalIncomePaise > 0
      ? Math.max(0, Math.round((netSavingsPaise / totalIncomePaise) * 100))
      : 0;

    // Build category breakdown with percentage
    const categoryBreakdown = [];
    categoryExpenseMap.forEach((amountPaise, category) => {
      const pct = totalExpensePaise > 0
        ? Math.round((amountPaise / totalExpensePaise) * 100)
        : 0;
      categoryBreakdown.push({
        category,
        amountPaise,
        percentage: pct,
      });
    });
    categoryBreakdown.sort((a, b) => b.amountPaise - a.amountPaise);

    // 2. Budgets with transaction reconciliation
    const budgets = await Budget.find({ userId });
    const reconciledBudgets = budgets.map((b) => {
      // Filter expenses for this budget category
      const spent = transactions
        .filter((t) => t.type === 'expense' && t.category === b.category)
        .reduce((sum, t) => sum + t.amountPaise, 0);

      const budgetPaise = b.limitPaise || b.amountPaise || 0;
      const utilizationPercent = budgetPaise > 0
        ? Math.round((spent / budgetPaise) * 100)
        : 0;

      return {
        id: b._id,
        category: b.category,
        budgetPaise: budgetPaise,
        spentPaise: spent,
        remainingPaise: Math.max(0, budgetPaise - spent),
        utilizationPercent,
        isOverBudget: spent > budgetPaise,
      };
    });

    // 3. Savings Goals Progress
    const savingsGoals = await SavingsGoal.find({ userId });
    const activeGoals = savingsGoals.map((g) => {
      const target = g.targetPaise || g.targetAmountPaise || 0;
      const saved = g.savedPaise || g.currentAmountPaise || 0;
      const goalTitle = g.name || g.title || 'Savings Goal';
      return {
        id: g._id,
        title: goalTitle,
        targetPaise: target,
        savedPaise: saved,
        progressPercent: target > 0 ? Math.round((saved / target) * 100) : 0,
        targetDate: g.targetDate,
        isCompleted: saved >= target,
      };
    });

    // 4. Recurring Commitments
    const commitments = await Commitment.find({ userId, isArchived: { $ne: true } });
    const now = new Date();
    let totalMonthlyCommitmentsPaise = 0;
    let overdueCommitmentsCount = 0;

    const commitmentSummaries = commitments.map((c) => {
      totalMonthlyCommitmentsPaise += c.amountPaise;
      const due = c.dueDate || c.nextDueDate;
      const isOverdue = due && new Date(due) < now;
      if (isOverdue) overdueCommitmentsCount++;

      return {
        id: c._id,
        title: c.title,
        type: c.type || c.category || 'Commitment',
        amountPaise: c.amountPaise,
        dueDate: due,
        isOverdue,
      };
    });

    // 5. Learning & Quiz Stats
    const progressRecords = await LearnerProgress.find({ userId });
    const completedCourses = progressRecords.filter((p) => p.isCompleted).length;
    const quizAttempts = await QuizAttempt.find({ userId });
    const passedAttempts = quizAttempts.filter((a) => a.passed).length;
    const quizPassRate = quizAttempts.length > 0
      ? Math.round((passedAttempts / quizAttempts.length) * 100)
      : 0;

    return successResponse(res, {
      summary: {
        totalIncomePaise,
        totalExpensePaise,
        netSavingsPaise,
        savingsRatePercent,
        totalTransactionsCount: transactions.length,
      },
      categoryBreakdown,
      budgets: reconciledBudgets,
      savingsGoals: activeGoals,
      commitments: {
        totalMonthlyCommitmentsPaise,
        overdueCommitmentsCount,
        activeList: commitmentSummaries,
      },
      learningStats: {
        coursesEnrolled: progressRecords.length,
        coursesCompleted: completedCourses,
        quizzesAttempted: quizAttempts.length,
        quizzesPassed: passedAttempts,
        quizPassRate,
      },
    }, 'User financial insights retrieved successfully');
  } catch (err) {
    return next(err);
  }
}

/**
 * Export user transactions to CSV strictly scoped to authorized user
 * GET /api/v1/insights/export-csv
 */
export async function exportUserTransactionsCsv(req, res, next) {
  try {
    const userId = req.user._id;
    const transactions = await Transaction.find({ userId }).sort({ date: -1 });

    const csvRows = [];
    // Header
    csvRows.push(['Date', 'Type', 'Category', 'Amount (INR)', 'Amount (Paise)', 'Description', 'Payment Method'].join(','));

    // Rows
    transactions.forEach((t) => {
      const dateStr = t.date ? new Date(t.date).toISOString().split('T')[0] : '';
      const inrAmount = (t.amountPaise / 100).toFixed(2);
      const safeDesc = `"${(t.description || '').replace(/"/g, '""')}"`;
      const safeCat = `"${(t.category || '').replace(/"/g, '""')}"`;
      const safeMethod = `"${(t.paymentMethod || 'cash').replace(/"/g, '""')}"`;

      csvRows.push([
        dateStr,
        t.type,
        safeCat,
        inrAmount,
        t.amountPaise,
        safeDesc,
        safeMethod,
      ].join(','));
    });

    const csvContent = csvRows.join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="finlearn_transactions_report.csv"');
    return res.status(200).send(csvContent);
  } catch (err) {
    return next(err);
  }
}

export default {
  getUserInsights,
  exportUserTransactionsCsv,
};
