import mongoose from 'mongoose';
import { Quiz } from '../models/quiz.model.js';
import { QuizAttempt } from '../models/quizAttempt.model.js';
import { Course } from '../models/course.model.js';
import { Lesson } from '../models/lesson.model.js';
import { LearnerProgress } from '../models/progress.model.js';
import { GamificationProfile } from '../models/gamification.model.js';
import { BADGE_DEFINITIONS } from '../config/gamification.config.js';
import { recordGamificationActivity } from '../utils/gamification.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import { config } from '../config/env.js';

// ==========================================
// 1. LEARNER QUIZ APIS
// ==========================================

/**
 * List published quizzes available for learners
 * GET /api/v1/quizzes
 */
export async function getPublishedQuizzes(req, res, next) {
  try {
    const { category, courseId } = req.query;
    // Exclude student-generated practice quizzes from official catalogue
    const query = { status: 'published', isPractice: { $ne: true } };

    if (category && category !== 'All') {
      query.category = category;
    }
    if (courseId) {
      query.courseId = courseId;
    }

    // Never return correctAnswerIndex or explanation in list
    const quizzes = await Quiz.find(query)
      .select('-questions.correctAnswerIndex -questions.explanation')
      .sort({ createdAt: -1 });

    // Fetch user's previous attempts summary for each quiz
    const quizIds = quizzes.map((q) => q._id);
    const userAttempts = await QuizAttempt.find({
      userId: req.user._id,
      quizId: { $in: quizIds },
    }).sort({ completedAt: -1 });

    const attemptsByQuiz = new Map();
    userAttempts.forEach((att) => {
      const qId = att.quizId.toString();
      if (!attemptsByQuiz.has(qId)) {
        attemptsByQuiz.set(qId, []);
      }
      attemptsByQuiz.get(qId).push(att);
    });

    const decorated = quizzes.map((q) => {
      const attempts = attemptsByQuiz.get(q._id.toString()) || [];
      const bestScore = attempts.length > 0 ? Math.max(...attempts.map((a) => a.scorePercentage)) : 0;
      const hasPassed = attempts.some((a) => a.passed);

      return {
        ...q.toJSON(),
        questionsCount: q.questions?.length || 0,
        attemptsCount: attempts.length,
        hasPassed,
        bestScore,
      };
    });

    return successResponse(res, { quizzes: decorated }, 'Published quizzes retrieved');
  } catch (err) {
    return next(err);
  }
}

/**
 * Get individual published quiz for learner (without exposing correct answers)
 * GET /api/v1/quizzes/:id
 */
export async function getQuizById(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid quiz ID format', 'VALIDATION_ERROR', 400);
    }

    const quiz = await Quiz.findOne({ _id: id, status: 'published' })
      .select('-questions.correctAnswerIndex -questions.explanation');

    if (!quiz) {
      return errorResponse(res, 'Quiz not found or not published', 'NOT_FOUND', 404);
    }

    // Get learner's past attempts
    const attempts = await QuizAttempt.find({
      userId: req.user._id,
      quizId: id,
    }).sort({ attemptNumber: -1 });

    return successResponse(
      res,
      {
        quiz: quiz.toJSON(),
        attempts: attempts.map((a) => a.toJSON()),
        nextAttemptNumber: attempts.length + 1,
      },
      'Quiz details retrieved'
    );
  } catch (err) {
    return next(err);
  }
}

/**
 * Submit quiz answers and calculate score authoritatively on server
 * POST /api/v1/quizzes/:id/submit
 */
export async function submitQuizAttempt(req, res, next) {
  try {
    const { id } = req.params;
    const { answers } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid quiz ID format', 'VALIDATION_ERROR', 400);
    }

    if (!Array.isArray(answers)) {
      return errorResponse(res, 'Answers array is required', 'VALIDATION_ERROR', 400);
    }

    // Fetch quiz including correctAnswerIndex and explanation for server grading
    const quiz = await Quiz.findOne({ _id: id, status: 'published' })
      .select('+questions.correctAnswerIndex +questions.explanation');

    if (!quiz) {
      return errorResponse(res, 'Quiz not found or not published', 'NOT_FOUND', 404);
    }

    if (!quiz.questions || quiz.questions.length === 0) {
      return errorResponse(res, 'Quiz contains no questions', 'BAD_REQUEST', 400);
    }

    // Map questions by ID for validation
    const questionMap = new Map();
    let totalMaxScore = 0;
    quiz.questions.forEach((q) => {
      questionMap.set(q._id.toString(), q);
      totalMaxScore += q.points || 10;
    });

    let earnedScore = 0;
    const gradedAnswers = [];
    const questionReview = [];

    // Verify submitted answers
    const submittedQIds = new Set();

    for (const ans of answers) {
      if (!ans || !ans.questionId) {
        return errorResponse(res, 'Malformed answer item in submission payload', 'VALIDATION_ERROR', 400);
      }
      const qIdStr = ans.questionId.toString();
      if (!questionMap.has(qIdStr)) {
        return errorResponse(res, `Unknown question ID: ${qIdStr}`, 'VALIDATION_ERROR', 400);
      }
      if (submittedQIds.has(qIdStr)) {
        return errorResponse(res, `Duplicate answer for question: ${qIdStr}`, 'VALIDATION_ERROR', 400);
      }
      submittedQIds.add(qIdStr);

      const targetQ = questionMap.get(qIdStr);
      const selectedIndex = parseInt(ans.selectedOptionIndex, 10);

      if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= targetQ.options.length) {
        return errorResponse(
          res,
          `Invalid option index ${ans.selectedOptionIndex} for question ${qIdStr}`,
          'VALIDATION_ERROR',
          400
        );
      }

      const isCorrect = selectedIndex === targetQ.correctAnswerIndex;
      const points = isCorrect ? (targetQ.points || 10) : 0;
      earnedScore += points;

      gradedAnswers.push({
        questionId: targetQ._id,
        selectedOptionIndex: selectedIndex,
        isCorrect,
        pointsAwarded: points,
      });

      // Construct safe review payload with correct answers and explanations after submission
      questionReview.push({
        questionId: targetQ._id.toString(),
        questionText: targetQ.questionText,
        options: targetQ.options,
        selectedOptionIndex: selectedIndex,
        correctAnswerIndex: targetQ.correctAnswerIndex,
        isCorrect,
        pointsAwarded: points,
        maxPoints: targetQ.points || 10,
        explanation: targetQ.explanation || '',
      });
    }

    // Any unsubmitted questions are graded as incorrect (0 points)
    quiz.questions.forEach((q) => {
      const qIdStr = q._id.toString();
      if (!submittedQIds.has(qIdStr)) {
        gradedAnswers.push({
          questionId: q._id,
          selectedOptionIndex: -1,
          isCorrect: false,
          pointsAwarded: 0,
        });
        questionReview.push({
          questionId: qIdStr,
          questionText: q.questionText,
          options: q.options,
          selectedOptionIndex: -1,
          correctAnswerIndex: q.correctAnswerIndex,
          isCorrect: false,
          pointsAwarded: 0,
          maxPoints: q.points || 10,
          explanation: q.explanation || '',
        });
      }
    });

    const scorePercentage = totalMaxScore > 0 ? Math.round((earnedScore / totalMaxScore) * 100) : 0;
    const passed = scorePercentage >= (quiz.passingScorePercent || 60);
    const isPerfectScore = scorePercentage === 100;

    // Check previous attempts count
    const previousAttemptsCount = await QuizAttempt.countDocuments({
      userId: req.user._id,
      quizId: quiz._id,
    });

    // Check if user has already passed this quiz previously (prevents farming bonus XP)
    const alreadyPassedBefore = await QuizAttempt.exists({
      userId: req.user._id,
      quizId: quiz._id,
      passed: true,
    });

    // Save attempt record
    const attempt = new QuizAttempt({
      userId: req.user._id,
      quizId: quiz._id,
      attemptNumber: previousAttemptsCount + 1,
      answers: gradedAnswers,
      score: earnedScore,
      maxScore: totalMaxScore,
      scorePercentage,
      passed,
      status: 'completed',
      completedAt: new Date(),
    });

    // Gamification: Award XP and streaks atomically
    // Only award pass bonus if not already passed before to prevent XP farming
    const gamificationUpdate = await recordGamificationActivity({
      userId: req.user._id,
      activityType: 'QUIZ_ATTEMPT',
      quizPassed: passed && !alreadyPassedBefore,
      isPerfectScore: isPerfectScore && !alreadyPassedBefore,
    });

    attempt.xpAwarded = gamificationUpdate.xpAwarded;
    await attempt.save();

    return successResponse(
      res,
      {
        attempt: attempt.toJSON(),
        score: earnedScore,
        maxScore: totalMaxScore,
        scorePercentage,
        passed,
        passingScorePercent: quiz.passingScorePercent,
        xpAwarded: gamificationUpdate.xpAwarded,
        newBadges: gamificationUpdate.newBadgesAwarded,
        review: questionReview,
      },
      'Quiz evaluated successfully'
    );
  } catch (err) {
    return next(err);
  }
}

/**
 * Get single attempt review
 * GET /api/v1/quizzes/attempts/:attemptId
 */
export async function getAttemptReview(req, res, next) {
  try {
    const { attemptId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(attemptId)) {
      return errorResponse(res, 'Invalid attempt ID format', 'VALIDATION_ERROR', 400);
    }

    const attempt = await QuizAttempt.findById(attemptId);
    if (!attempt) {
      return errorResponse(res, 'Attempt not found', 'NOT_FOUND', 404);
    }

    // Enforce ownership: only the owner or admin can view results
    if (attempt.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return errorResponse(res, 'Access denied to this attempt record', 'FORBIDDEN', 403);
    }

    const quiz = await Quiz.findById(attempt.quizId)
      .select('+questions.correctAnswerIndex +questions.explanation');

    if (!quiz) {
      return errorResponse(res, 'Quiz associated with attempt no longer exists', 'NOT_FOUND', 404);
    }

    const answersMap = new Map();
    attempt.answers.forEach((a) => answersMap.set(a.questionId.toString(), a));

    const review = quiz.questions.map((q) => {
      const userAns = answersMap.get(q._id.toString());
      return {
        questionId: q._id.toString(),
        questionText: q.questionText,
        options: q.options,
        selectedOptionIndex: userAns ? userAns.selectedOptionIndex : -1,
        correctAnswerIndex: q.correctAnswerIndex,
        isCorrect: userAns ? userAns.isCorrect : false,
        pointsAwarded: userAns ? userAns.pointsAwarded : 0,
        maxPoints: q.points || 10,
        explanation: q.explanation || '',
      };
    });

    return successResponse(
      res,
      {
        attempt: attempt.toJSON(),
        quizTitle: quiz.title,
        review,
      },
      'Attempt review retrieved'
    );
  } catch (err) {
    return next(err);
  }
}

// ==========================================
// 2. GAMIFICATION APIS
// ==========================================

/**
 * Get authenticated user's gamification profile and all badge definitions
 * GET /api/v1/gamification/profile
 */
export async function getGamificationProfile(req, res, next) {
  try {
    let profile = await GamificationProfile.findOne({ userId: req.user._id });
    if (!profile) {
      profile = new GamificationProfile({ userId: req.user._id });
      await profile.save();
    }

    const earnedSet = new Set(profile.earnedBadges.map((b) => b.badgeId));

    const allBadgesWithStatus = BADGE_DEFINITIONS.map((b) => ({
      ...b,
      isEarned: earnedSet.has(b.id),
      earnedAt: profile.earnedBadges.find((eb) => eb.badgeId === b.id)?.earnedAt || null,
    }));

    return successResponse(
      res,
      {
        profile: profile.toJSON(),
        badges: allBadgesWithStatus,
      },
      'Gamification profile retrieved'
    );
  } catch (err) {
    return next(err);
  }
}

/**
 * Get global learning leaderboard with pagination and user ranking
 * GET /api/v1/quizzes/gamification/leaderboard
 */
export async function getLeaderboard(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    // Fetch top profiles sorted by totalXp descending, currentStreak descending, createdAt ascending, and _id ascending for deterministic tie-breaking
    const [topProfiles, totalCount] = await Promise.all([
      GamificationProfile.find()
        .sort({ totalXp: -1, currentStreak: -1, createdAt: 1, _id: 1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name username bio isProfilePublic createdAt')
        .lean(),
      GamificationProfile.countDocuments(),
    ]);

    // Format leaderboard entries ensuring user privacy
    const entries = topProfiles.map((p, index) => {
      const user = p.userId;
      const isPublic = user?.isProfilePublic !== false;
      return {
        rank: skip + index + 1,
        userId: user?._id?.toString() || p.userId?.toString(),
        name: isPublic ? (user?.name || 'Anonymous Learner') : 'Private Learner',
        username: isPublic ? (user?.username || null) : null,
        bio: isPublic ? (user?.bio || '') : '',
        totalXp: p.totalXp || 0,
        currentStreak: p.currentStreak || 0,
        longestStreak: p.longestStreak || 0,
        completedLessonsCount: p.completedLessonsCount || 0,
        passedQuizzesCount: p.passedQuizzesCount || 0,
        badgesCount: p.earnedBadges?.length || 0,
        isCurrentUser: user?._id?.toString() === req.user?._id?.toString(),
      };
    });

    // Compute current user's actual global rank with deterministic tie-breaking
    let currentUserRank = null;
    let currentUserProfile = null;
    if (req.user) {
      const myProfile = await GamificationProfile.findOne({ userId: req.user._id }).lean();
      if (myProfile) {
        const higherCount = await GamificationProfile.countDocuments({
          $or: [
            { totalXp: { $gt: myProfile.totalXp } },
            { totalXp: myProfile.totalXp, currentStreak: { $gt: myProfile.currentStreak } },
            { totalXp: myProfile.totalXp, currentStreak: myProfile.currentStreak, createdAt: { $lt: myProfile.createdAt } },
            { totalXp: myProfile.totalXp, currentStreak: myProfile.currentStreak, createdAt: myProfile.createdAt, _id: { $lt: myProfile._id } },
          ],
        });
        currentUserRank = higherCount + 1;
        currentUserProfile = {
          rank: currentUserRank,
          totalXp: myProfile.totalXp,
          currentStreak: myProfile.currentStreak,
          completedLessonsCount: myProfile.completedLessonsCount,
          passedQuizzesCount: myProfile.passedQuizzesCount,
          badgesCount: myProfile.earnedBadges?.length || 0,
        };
      }
    }

    return successResponse(
      res,
      {
        leaderboard: entries,
        currentUser: currentUserProfile,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit),
          totalEntries: totalCount,
        },
      },
      'Leaderboard retrieved successfully'
    );
  } catch (err) {
    return next(err);
  }
}

// ==========================================
// 3. ADMIN QUIZ MANAGEMENT APIS
// ==========================================

/**
 * Admin: List all quizzes (draft, published, archived)
 * GET /api/v1/admin/quizzes
 */
export async function adminGetQuizzes(req, res, next) {
  try {
    const quizzes = await Quiz.find().sort({ createdAt: -1 });
    return successResponse(res, { quizzes }, 'All quizzes retrieved for admin');
  } catch (err) {
    return next(err);
  }
}

/**
 * Admin: Create a new quiz
 * POST /api/v1/admin/quizzes
 */
export async function adminCreateQuiz(req, res, next) {
  try {
    const {
      title,
      description,
      category,
      difficulty,
      courseId,
      lessonId,
      passingScorePercent,
      timeLimitMinutes,
      status,
      questions,
    } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      return errorResponse(res, 'Quiz title must be at least 3 characters', 'VALIDATION_ERROR', 400);
    }
    if (!description || typeof description !== 'string') {
      return errorResponse(res, 'Quiz description is required', 'VALIDATION_ERROR', 400);
    }

    if (courseId && !mongoose.Types.ObjectId.isValid(courseId)) {
      return errorResponse(res, 'Invalid courseId format', 'VALIDATION_ERROR', 400);
    }
    if (lessonId && !mongoose.Types.ObjectId.isValid(lessonId)) {
      return errorResponse(res, 'Invalid lessonId format', 'VALIDATION_ERROR', 400);
    }

    // Validate questions if provided
    const validatedQuestions = [];
    if (Array.isArray(questions)) {
      for (const q of questions) {
        if (!q.questionText || q.questionText.trim().length < 5) {
          return errorResponse(res, 'Each question must have at least 5 characters', 'VALIDATION_ERROR', 400);
        }
        if (!Array.isArray(q.options) || q.options.length < 2) {
          return errorResponse(res, 'Each question must have at least 2 options', 'VALIDATION_ERROR', 400);
        }
        const correctIdx = parseInt(q.correctAnswerIndex, 10);
        if (isNaN(correctIdx) || correctIdx < 0 || correctIdx >= q.options.length) {
          return errorResponse(res, 'Invalid correctAnswerIndex for question', 'VALIDATION_ERROR', 400);
        }

        validatedQuestions.push({
          questionText: q.questionText.trim(),
          questionType: q.questionType || (q.options.length === 2 ? 'true_false' : 'mcq'),
          options: q.options.map((opt) => opt.trim()),
          correctAnswerIndex: correctIdx,
          explanation: q.explanation?.trim() || '',
          points: parseInt(q.points, 10) || 10,
          topic: q.topic?.trim() || 'General',
        });
      }
    }

    const quiz = new Quiz({
      title: title.trim(),
      description: description.trim(),
      category: category || 'Budgeting',
      difficulty: difficulty || 'Beginner',
      courseId: courseId || null,
      lessonId: lessonId || null,
      passingScorePercent: parseInt(passingScorePercent, 10) || 60,
      timeLimitMinutes: parseInt(timeLimitMinutes, 10) || 0,
      status: status === 'published' ? 'published' : 'draft',
      questions: validatedQuestions,
      createdBy: req.user._id,
    });

    await quiz.save();

    logAuditEvent({
      actor: req.user,
      action: 'QUIZ_CREATED',
      targetType: 'Quiz',
      targetId: quiz._id,
      details: { title: quiz.title, category: quiz.category },
      ipAddress: req.ip || '127.0.0.1',
    });

    return successResponse(res, { quiz: quiz.toJSON() }, 'Quiz created successfully', 201);
  } catch (err) {
    return next(err);
  }
}

/**
 * Admin: Update quiz details or publish/unpublish
 * PATCH /api/v1/admin/quizzes/:id
 */
export async function adminUpdateQuiz(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid quiz ID format', 'VALIDATION_ERROR', 400);
    }

    const quiz = await Quiz.findById(id).select('+questions.correctAnswerIndex +questions.explanation');
    if (!quiz) {
      return errorResponse(res, 'Quiz not found', 'NOT_FOUND', 404);
    }

    const {
      title,
      description,
      category,
      difficulty,
      courseId,
      lessonId,
      passingScorePercent,
      timeLimitMinutes,
      status,
      questions,
    } = req.body;

    if (title !== undefined) quiz.title = title.trim();
    if (description !== undefined) quiz.description = description.trim();
    if (category !== undefined) quiz.category = category;
    if (difficulty !== undefined) quiz.difficulty = difficulty;
    if (courseId !== undefined) quiz.courseId = courseId || null;
    if (lessonId !== undefined) quiz.lessonId = lessonId || null;
    if (passingScorePercent !== undefined) quiz.passingScorePercent = parseInt(passingScorePercent, 10);
    if (timeLimitMinutes !== undefined) quiz.timeLimitMinutes = parseInt(timeLimitMinutes, 10);

    // If publishing, ensure there is at least one question
    if (status === 'published') {
      const qCount = questions !== undefined ? questions.length : quiz.questions.length;
      if (qCount === 0) {
        return errorResponse(res, 'Cannot publish a quiz with 0 questions', 'VALIDATION_ERROR', 400);
      }
      quiz.status = 'published';
    } else if (status !== undefined) {
      quiz.status = status;
    }

    if (Array.isArray(questions)) {
      const validated = [];
      for (const q of questions) {
        if (!q.questionText || q.questionText.trim().length < 5) {
          return errorResponse(res, 'Each question must have at least 5 characters', 'VALIDATION_ERROR', 400);
        }
        if (!Array.isArray(q.options) || q.options.length < 2) {
          return errorResponse(res, 'Each question must have at least 2 options', 'VALIDATION_ERROR', 400);
        }
        const correctIdx = parseInt(q.correctAnswerIndex, 10);
        if (isNaN(correctIdx) || correctIdx < 0 || correctIdx >= q.options.length) {
          return errorResponse(res, 'Invalid correctAnswerIndex for question', 'VALIDATION_ERROR', 400);
        }
        validated.push({
          questionText: q.questionText.trim(),
          questionType: q.questionType || (q.options.length === 2 ? 'true_false' : 'mcq'),
          options: q.options.map((opt) => opt.trim()),
          correctAnswerIndex: correctIdx,
          explanation: q.explanation?.trim() || '',
          points: parseInt(q.points, 10) || 10,
          topic: q.topic?.trim() || 'General',
        });
      }
      quiz.questions = validated;
    }

    quiz.updatedBy = req.user._id;
    await quiz.save();

    logAuditEvent({
      actor: req.user,
      action: quiz.status === 'published' ? 'QUIZ_PUBLISHED' : 'QUIZ_UPDATED',
      targetType: 'Quiz',
      targetId: quiz._id,
      details: { title: quiz.title, status: quiz.status },
      ipAddress: req.ip || '127.0.0.1',
    });

    return successResponse(res, { quiz: quiz.toJSON() }, 'Quiz updated successfully');
  } catch (err) {
    return next(err);
  }
}

/**
 * Admin: Add a single question to an existing quiz
 * POST /api/v1/admin/quizzes/:id/questions
 */
export async function adminAddQuestion(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid quiz ID format', 'VALIDATION_ERROR', 400);
    }

    const quiz = await Quiz.findById(id).select('+questions.correctAnswerIndex +questions.explanation');
    if (!quiz) {
      return errorResponse(res, 'Quiz not found', 'NOT_FOUND', 404);
    }

    const {
      questionText,
      questionType,
      options,
      correctAnswerIndex,
      explanation,
      points,
      topic,
    } = req.body;

    if (!questionText || questionText.trim().length < 5) {
      return errorResponse(res, 'Question text must be at least 5 characters', 'VALIDATION_ERROR', 400);
    }
    if (!Array.isArray(options) || options.length < 2) {
      return errorResponse(res, 'Question must have at least 2 options', 'VALIDATION_ERROR', 400);
    }
    const correctIdx = parseInt(correctAnswerIndex, 10);
    if (isNaN(correctIdx) || correctIdx < 0 || correctIdx >= options.length) {
      return errorResponse(res, 'Invalid correctAnswerIndex', 'VALIDATION_ERROR', 400);
    }

    quiz.questions.push({
      questionText: questionText.trim(),
      questionType: questionType || (options.length === 2 ? 'true_false' : 'mcq'),
      options: options.map((opt) => opt.trim()),
      correctAnswerIndex: correctIdx,
      explanation: explanation?.trim() || '',
      points: parseInt(points, 10) || 10,
      topic: topic?.trim() || 'General',
    });

    quiz.updatedBy = req.user._id;
    await quiz.save();

    return successResponse(res, { quiz: quiz.toJSON() }, 'Question added to quiz successfully', 201);
  } catch (err) {
    return next(err);
  }
}

/**
 * Admin: Generate an AI-assisted draft quiz from course/topic context
 * INVARIANT: Generated quiz ALWAYS starts in 'draft' status with 'pending_human_review'
 * POST /api/v1/assessment/admin/quizzes/generate-draft
 */
export async function adminGenerateQuizDraft(req, res, next) {
  try {
    const {
      title,
      description,
      category = 'Budgeting',
      difficulty = 'Beginner',
      courseId = null,
      lessonId = null,
      customPrompt = '',
    } = req.body;

    const quizTitle = title?.trim() || `Draft AI Assessment: ${category} Fundamentals`;
    const quizDesc = description?.trim() || `Automated draft quiz generated for review and human verification on ${category}.`;

    // Educational question templates grounded in FinLearn Indian curriculum
    const generatedQuestions = [
      {
        questionText: `In standard financial budgeting, what percentage of monthly income should ideally be reserved for emergency savings according to the 50-30-20 principle?`,
        questionType: 'mcq',
        options: ['10%', '20%', '30%', '50%'],
        correctAnswerIndex: 1,
        explanation: 'Under the 50-30-20 allocation rule, 20% is earmarked for debt prepayment and emergency savings reserve.',
        points: 10,
        topic: category,
      },
      {
        questionText: `Entering an SMS OTP or UPI PIN will credit money into your bank account.`,
        questionType: 'true_false',
        options: ['True', 'False'],
        correctAnswerIndex: 1,
        explanation: 'Entering a UPI PIN or OTP always authorizes a debit transaction, never a credit.',
        points: 10,
        topic: 'Cyber Safety',
      },
      {
        questionText: `Which of the following describes reducing-balance loan interest compared to flat interest rates?`,
        questionType: 'mcq',
        options: [
          'Interest is charged on already repaid principal throughout tenure',
          'Interest is only calculated on the remaining outstanding principal balance each month',
          'Interest increases as you repay more principal',
          'No interest is charged if paid before 30 days',
        ],
        correctAnswerIndex: 1,
        explanation: 'Reducing-balance calculates interest exclusively on the decreasing outstanding balance each month.',
        points: 10,
        topic: 'Borrowing',
      },
    ];

    const newQuiz = new Quiz({
      title: quizTitle,
      description: quizDesc,
      category,
      difficulty,
      courseId: courseId && mongoose.Types.ObjectId.isValid(courseId) ? courseId : null,
      lessonId: lessonId && mongoose.Types.ObjectId.isValid(lessonId) ? lessonId : null,
      passingScorePercent: 60,
      timeLimitMinutes: 10,
      status: 'draft', // CRITICAL INVARIANT: NEVER AUTO-PUBLISHED
      isAiGenerated: true,
      aiReviewStatus: 'pending_human_review',
      questions: generatedQuestions,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    await newQuiz.save();

    logAuditEvent({
      actor: req.user,
      action: 'QUIZ_DRAFT_GENERATED',
      targetType: 'Quiz',
      targetId: newQuiz._id,
      details: { title: newQuiz.title, isAiGenerated: true, aiReviewStatus: 'pending_human_review' },
      ipAddress: req.ip || '127.0.0.1',
    });

    return successResponse(
      res,
      { quiz: newQuiz.toJSON() },
      'AI draft quiz generated successfully. Awaiting human editorial review before publishing.',
      201
    );
  } catch (err) {
    return next(err);
  }
}

/**
 * Generate an AI-assisted practice quiz for a student who completed all lessons in a course/module
 * INVARIANT: Persisted module completion is enforced.
 * INVARIANT: Created quiz has isPractice: true, isAiGenerated: true, status: 'published' for immediate attempt.
 * INVARIANT: Does NOT alter or publish official instructor exams.
 * POST /api/v1/assessment/quizzes/generate-practice
 */
export async function generateModulePracticeQuiz(req, res, next) {
  try {
    const { courseId, difficulty = 'Beginner', questionCount = 3 } = req.body;

    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      return errorResponse(res, 'Valid course ID is required', 'VALIDATION_ERROR', 400);
    }

    const course = await Course.findOne({ _id: courseId, status: 'published' });
    if (!course) {
      return errorResponse(res, 'Course module not found or not published', 'NOT_FOUND', 404);
    }

    // Fetch all published lessons for this course
    const lessons = await Lesson.find({ courseId, status: 'published' }).sort({ order: 1 });
    if (!lessons || lessons.length === 0) {
      return errorResponse(res, 'Course module has no lessons and cannot generate a quiz', 'BAD_REQUEST', 400);
    }

    // Completion rule: Check persisted completion records in LearnerProgress
    const completedProgress = await LearnerProgress.find({
      userId: req.user._id,
      courseId,
      isCompleted: true,
    });

    const completedLessonIds = new Set(completedProgress.map((p) => p.lessonId.toString()));
    const allCompleted = lessons.every((l) => completedLessonIds.has(l._id.toString()));

    if (!allCompleted) {
      return errorResponse(
        res,
        'All required lessons in this module must be completed before generating a practice quiz',
        'FORBIDDEN',
        403
      );
    }

    // Sanitize question count (min 2, max 10)
    const count = Math.min(Math.max(parseInt(questionCount, 10) || 3, 2), 10);

    // Prepare curriculum context from lessons
    const moduleContext = lessons
      .map((l, i) => `Chapter ${i + 1}: ${l.title}\n${l.content.slice(0, 1500)}`)
      .join('\n\n---\n\n');

    let generatedQuestions = [];

    // Attempt generation with Gemini if API key configured
    if (config.geminiApiKey) {
      try {
        const prompt = `You are a financial literacy curriculum specialist for FinLearn.
Generate ${count} multiple-choice practice quiz questions grounded STRICTLY in the following course module content.

Course Title: "${course.title}"
Category: "${course.category}"
Target Difficulty: "${difficulty}"

Course Lessons Content:
${moduleContext.slice(0, 6000)}

Requirements:
1. Each question must test factual knowledge or realistic financial concepts directly discussed in the lessons above.
2. Provide between 2 and 4 options for each question.
3. Indicate the zero-based index of the correct answer.
4. Provide a clear educational explanation for why that answer is correct.
5. Return ONLY a valid JSON array of objects with the exact schema below, with NO markdown backticks or commentary:
[
  {
    "questionText": "Question string?",
    "questionType": "mcq",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswerIndex": 0,
    "explanation": "Explanation why Option A is correct.",
    "points": 10,
    "topic": "${course.category}"
  }
]`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${config.geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 1500,
              },
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          let rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
          if (rawText.startsWith('```json')) rawText = rawText.replace(/^```json/, '').replace(/```$/, '').trim();
          if (rawText.startsWith('```')) rawText = rawText.replace(/^```/, '').replace(/```$/, '').trim();

          const parsed = JSON.parse(rawText);
          if (Array.isArray(parsed) && parsed.length > 0) {
            generatedQuestions = parsed;
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini practice quiz generation failed, using grounded fallback generator:', geminiErr.message);
      }
    }

    // Grounded fallback generation if Gemini offline or returned empty
    if (!generatedQuestions || generatedQuestions.length === 0) {
      generatedQuestions = lessons.slice(0, count).map((l, idx) => {
        const cleanContent = l.content.replace(/[#*`_]/g, ' ').replace(/\s+/g, ' ').trim();
        const firstSentence = cleanContent.split(/[.?!]/).filter((s) => s.trim().length > 15)[0] || l.title;

        return {
          questionText: `According to the chapter "${l.title}", which of the following statements is correct regarding ${course.category}?`,
          questionType: 'mcq',
          options: [
            `${firstSentence.trim()}.`,
            `The topic of ${l.title} has no relevance to financial safety or planning.`,
            `You should bypass standard verification rules when dealing with ${course.category}.`,
            `None of the discussed principles apply in Indian personal finance.`,
          ],
          correctAnswerIndex: 0,
          explanation: `In the chapter "${l.title}", the core concept established is: ${firstSentence.trim()}.`,
          points: 10,
          topic: course.category,
        };
      });
    }

    // Validate schema & answer keys before saving
    const validatedQuestions = [];
    for (const q of generatedQuestions) {
      if (!q.questionText || q.questionText.trim().length < 5) continue;
      if (!Array.isArray(q.options) || q.options.length < 2) continue;
      const cIdx = parseInt(q.correctAnswerIndex, 10);
      if (isNaN(cIdx) || cIdx < 0 || cIdx >= q.options.length) continue;

      validatedQuestions.push({
        questionText: q.questionText.trim(),
        questionType: q.options.length === 2 ? 'true_false' : 'mcq',
        options: q.options.map((opt) => String(opt).trim()),
        correctAnswerIndex: cIdx,
        explanation: q.explanation ? String(q.explanation).trim() : 'Review course material.',
        points: parseInt(q.points, 10) || 10,
        topic: q.topic?.trim() || course.category,
      });
    }

    if (validatedQuestions.length === 0) {
      return errorResponse(res, 'Failed to validate generated questions. Please retry.', 'GENERATION_ERROR', 500);
    }

    // Save as practice quiz: published so student can take it, but tagged isPractice: true so it's isolated
    const practiceQuiz = new Quiz({
      title: `Practice Quiz: ${course.title}`,
      description: `AI-generated practice assessment covering the completed curriculum of "${course.title}".`,
      category: course.category,
      difficulty,
      courseId: course._id,
      passingScorePercent: 60,
      timeLimitMinutes: 0,
      status: 'published',
      isAiGenerated: true,
      isPractice: true,
      aiReviewStatus: 'not_applicable',
      questions: validatedQuestions,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    await practiceQuiz.save();

    logAuditEvent({
      actor: req.user,
      action: 'PRACTICE_QUIZ_GENERATED',
      targetType: 'Quiz',
      targetId: practiceQuiz._id,
      details: {
        courseId: course._id,
        courseTitle: course.title,
        questionsCount: validatedQuestions.length,
        isPractice: true,
      },
      ipAddress: req.ip || '127.0.0.1',
    });

    return successResponse(
      res,
      {
        quizId: practiceQuiz._id.toString(),
        quiz: practiceQuiz.toJSON(),
      },
      'Practice quiz generated successfully',
      201
    );
  } catch (err) {
    return next(err);
  }
}

export default {
  getPublishedQuizzes,
  getQuizById,
  submitQuizAttempt,
  getAttemptReview,
  getGamificationProfile,
  generateModulePracticeQuiz,
  adminGetQuizzes,
  adminCreateQuiz,
  adminUpdateQuiz,
  adminAddQuestion,
  adminGenerateQuizDraft,
};
