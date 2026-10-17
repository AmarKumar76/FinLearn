import mongoose from 'mongoose';
import { User } from '../models/user.model.js';
import { Course } from '../models/course.model.js';
import { Quiz } from '../models/quiz.model.js';
import { QuizAttempt } from '../models/quizAttempt.model.js';
import { AuditLog } from '../models/auditLog.model.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

/**
 * Get system and learning aggregate analytics for admins
 * INVARIANT: Never returns or leaks individual private user financial transactions or notes
 * GET /api/v1/admin/analytics
 */
export async function getAdminAnalytics(req, res, next) {
  try {
    const [
      totalLearners,
      totalCourses,
      publishedCourses,
      totalQuizzes,
      totalAttempts,
      passedAttempts,
      recentAuditLogsCount,
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Course.countDocuments(),
      Course.countDocuments({ status: 'published' }),
      Quiz.countDocuments(),
      QuizAttempt.countDocuments(),
      QuizAttempt.countDocuments({ passed: true }),
      AuditLog.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      }),
    ]);

    const averagePassRate = totalAttempts > 0
      ? Math.round((passedAttempts / totalAttempts) * 100)
      : 0;

    return successResponse(res, {
      analytics: {
        totalLearners,
        totalCourses,
        publishedCourses,
        totalQuizzes,
        totalAttempts,
        passedAttempts,
        averagePassRate,
        recentAuditLogsCount,
      },
    }, 'Admin aggregate analytics retrieved successfully');
  } catch (err) {
    return next(err);
  }
}

/**
 * Get paginated system audit logs for administrative compliance
 * GET /api/v1/admin/audit-logs
 */
export async function getAdminAuditLogs(req, res, next) {
  try {
    const { action, targetType, outcome, page = 1, limit = 20 } = req.query;

    const query = {};
    if (action) query.action = action;
    if (targetType) query.targetType = targetType;
    if (outcome) query.outcome = outcome;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [logs, totalCount] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      AuditLog.countDocuments(query),
    ]);

    return successResponse(res, {
      auditLogs: logs.map((l) => l.toJSON()),
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    }, 'Audit logs retrieved successfully');
  } catch (err) {
    return next(err);
  }
}

export default {
  getAdminAnalytics,
  getAdminAuditLogs,
};
