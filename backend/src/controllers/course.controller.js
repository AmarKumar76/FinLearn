import fs from 'fs';
import { Course, COURSE_CATEGORIES, DIFFICULTY_LEVELS } from '../models/course.model.js';
import { Lesson } from '../models/lesson.model.js';
import { Material } from '../models/material.model.js';
import { LearnerProgress } from '../models/progress.model.js';
import { validatePdfMagicBytes } from '../utils/storage.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import { seedCurriculum } from '../../scripts/seedCurriculum.js';

// ==========================================
// 1. LEARNER COURSE APIS
// ==========================================

/**
 * List published courses for learners with completion progress
 * GET /api/v1/courses
 */
export async function getPublishedCourses(req, res, next) {
  try {
    const { category, search, language } = req.query;
    const query = { status: 'published' };

    if (category && category !== 'All') {
      query.category = category;
    }
    if (language) {
      query.language = language;
    }
    if (search && typeof search === 'string' && search.trim()) {
      const sanitized = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { title: { $regex: sanitized, $options: 'i' } },
        { description: { $regex: sanitized, $options: 'i' } },
      ];
    }

    let courses = await Course.find(query).sort({ createdAt: -1 });

    // Self-healing: If no published courses exist and no search filter is applied,
    // automatically seed standard curriculum to prevent empty library state
    if (courses.length === 0 && (!category || category === 'All') && !search && !language) {
      const totalPublished = await Course.countDocuments({ status: 'published' });
      if (totalPublished === 0) {
        try {
          await seedCurriculum({ silent: true });
          courses = await Course.find(query).sort({ createdAt: -1 });
        } catch (seedErr) {
          console.error('[COURSE_CONTROLLER] Auto-seed curriculum notice:', seedErr.message);
        }
      }
    }

    // Populate published lesson count and user completion status for each course
    const populated = await Promise.all(
      courses.map(async (c) => {
        const [publishedLessons, completedProgress] = await Promise.all([
          Lesson.find({ courseId: c._id, status: 'published' }).sort({ order: 1 }),
          LearnerProgress.find({ userId: req.user._id, courseId: c._id, isCompleted: true }),
        ]);

        const totalLessons = publishedLessons.length;
        const completedLessons = completedProgress.length;
        const progressPct =
          totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

        return {
          ...c.toJSON(),
          totalLessons,
          completedLessons,
          progressPct,
        };
      })
    );

    return successResponse(res, { courses: populated }, 'Published courses retrieved');
  } catch (err) {
    return next(err);
  }
}

/**
 * Get individual published course details and ordered published lessons
 * GET /api/v1/courses/:id
 */
export async function getPublishedCourseById(req, res, next) {
  try {
    const { id } = req.params;
    const course = await Course.findOne({ _id: id, status: 'published' });
    if (!course) {
      return errorResponse(res, 'Course not found or not published', 'NOT_FOUND', 404);
    }

    const [lessons, userProgress, materials] = await Promise.all([
      Lesson.find({ courseId: id, status: 'published' }).sort({ order: 1 }),
      LearnerProgress.find({ userId: req.user._id, courseId: id, isCompleted: true }),
      Material.find({ courseId: id, status: 'published' }),
    ]);

    const completedLessonIds = new Set(userProgress.map((p) => p.lessonId.toString()));

    const decoratedLessons = lessons.map((l) => ({
      ...l.toJSON(),
      isCompleted: completedLessonIds.has(l._id.toString()),
    }));

    const totalLessons = lessons.length;
    const completedLessons = userProgress.length;
    const progressPct =
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    return successResponse(
      res,
      {
        course: course.toJSON(),
        lessons: decoratedLessons,
        materials: materials.map((m) => m.toJSON()),
        progress: {
          totalLessons,
          completedLessons,
          progressPct,
        },
      },
      'Course details retrieved'
    );
  } catch (err) {
    return next(err);
  }
}

// ==========================================
// 2. LEARNER LESSON & PROGRESS APIS
// ==========================================

/**
 * Get single published lesson with user completion state
 * GET /api/v1/lessons/:id
 */
export async function getPublishedLessonById(req, res, next) {
  try {
    const { id } = req.params;
    const lesson = await Lesson.findOne({ _id: id, status: 'published' });
    if (!lesson) {
      return errorResponse(res, 'Lesson not found or not published', 'NOT_FOUND', 404);
    }

    // Verify parent course is published
    const course = await Course.findOne({ _id: lesson.courseId, status: 'published' });
    if (!course) {
      return errorResponse(res, 'Parent course is not published', 'NOT_FOUND', 404);
    }

    const [progress, materials] = await Promise.all([
      LearnerProgress.findOne({ userId: req.user._id, lessonId: id }),
      Material.find({ lessonId: id, status: 'published' }),
    ]);

    return successResponse(
      res,
      {
        lesson: {
          ...lesson.toJSON(),
          isCompleted: Boolean(progress?.isCompleted),
        },
        course: course.toJSON(),
        materials: materials.map((m) => m.toJSON()),
      },
      'Lesson retrieved'
    );
  } catch (err) {
    return next(err);
  }
}

/**
 * Mark lesson as completed for the authenticated learner (Idempotent)
 * POST /api/v1/lessons/:id/progress
 */
export async function markLessonComplete(req, res, next) {
  try {
    const { id } = req.params;
    const lesson = await Lesson.findOne({ _id: id, status: 'published' });
    if (!lesson) {
      return errorResponse(res, 'Lesson not found or not published', 'NOT_FOUND', 404);
    }

    const existingProgress = await LearnerProgress.findOne({
      userId: req.user._id,
      lessonId: id,
      isCompleted: true,
    });

    const progress = await LearnerProgress.findOneAndUpdate(
      { userId: req.user._id, lessonId: id },
      {
        userId: req.user._id,
        courseId: lesson.courseId,
        lessonId: id,
        isCompleted: true,
        completedAt: new Date(),
      },
      { upsert: true, returnDocument: 'after' }
    );

    // If this is the learner's first time completing this lesson, award XP and update streak
    let gamificationResult = null;
    if (!existingProgress) {
      try {
        const { recordGamificationActivity } = await import('../utils/gamification.js');
        gamificationResult = await recordGamificationActivity({
          userId: req.user._id,
          activityType: 'LESSON_COMPLETE',
        });
      } catch (gameErr) {
        console.error('Gamification tracking error on lesson completion:', gameErr.message);
      }
    }

    // Calculate updated course progress percentage
    const [publishedLessons, completedLessons] = await Promise.all([
      Lesson.countDocuments({ courseId: lesson.courseId, status: 'published' }),
      LearnerProgress.countDocuments({
        userId: req.user._id,
        courseId: lesson.courseId,
        isCompleted: true,
      }),
    ]);

    const progressPct =
      publishedLessons > 0 ? Math.round((completedLessons / publishedLessons) * 100) : 0;

    return successResponse(
      res,
      {
        progress: progress.toJSON(),
        courseProgress: {
          totalLessons: publishedLessons,
          completedLessons,
          progressPct,
        },
      },
      'Lesson progress recorded successfully'
    );
  } catch (err) {
    return next(err);
  }
}

// ==========================================
// 3. SECURE PDF MATERIAL ACCESS
// ==========================================

/**
 * Download or stream published educational PDF material
 * GET /api/v1/materials/:id/download
 */
export async function downloadMaterial(req, res, next) {
  try {
    const { id } = req.params;
    const material = await Material.findById(id);
    if (!material) {
      return errorResponse(res, 'Material not found', 'NOT_FOUND', 404);
    }

    // Non-admin users cannot download unpublished/draft materials
    if (material.status !== 'published' && req.user.role !== 'admin') {
      return errorResponse(res, 'Material access denied', 'FORBIDDEN', 403);
    }

    if (!fs.existsSync(material.filePath)) {
      return errorResponse(res, 'Target file not found on storage server', 'NOT_FOUND', 404);
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${material.originalFilename}"`);
    const fileStream = fs.createReadStream(material.filePath);
    return fileStream.pipe(res);
  } catch (err) {
    return next(err);
  }
}

// ==========================================
// 4. ADMIN-ONLY CONTENT MANAGEMENT APIS
// ==========================================

/**
 * List all courses (draft, published, archived) for admin
 * GET /api/v1/admin/courses
 */
export async function adminGetCourses(req, res, next) {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });

    const decorated = await Promise.all(
      courses.map(async (c) => {
        const lessonCount = await Lesson.countDocuments({ courseId: c._id });
        return {
          ...c.toJSON(),
          lessonCount,
        };
      })
    );

    return successResponse(res, { courses: decorated }, 'Admin courses retrieved');
  } catch (err) {
    return next(err);
  }
}

/**
 * Create course (Admin only)
 * POST /api/v1/admin/courses
 */
export async function adminCreateCourse(req, res, next) {
  try {
    const { title, description, category, difficulty, language, learningObjectives } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      return errorResponse(res, 'Course title must be at least 3 characters', 'VALIDATION_ERROR', 400);
    }

    if (!description || typeof description !== 'string' || !description.trim()) {
      return errorResponse(res, 'Course description is required', 'VALIDATION_ERROR', 400);
    }

    if (!COURSE_CATEGORIES.includes(category)) {
      return errorResponse(res, `Invalid category: ${category}`, 'VALIDATION_ERROR', 400);
    }

    const course = new Course({
      title: title.trim(),
      description: description.trim(),
      category,
      difficulty: DIFFICULTY_LEVELS.includes(difficulty) ? difficulty : 'Beginner',
      language: ['en', 'hi'].includes(language) ? language : 'en',
      learningObjectives: Array.isArray(learningObjectives) ? learningObjectives : [],
      status: 'draft',
      createdBy: req.user._id,
    });

    await course.save();

    logAuditEvent({
      actor: req.user,
      action: 'COURSE_CREATED',
      targetType: 'Course',
      targetId: course._id,
      details: { title: course.title, category: course.category },
      ipAddress: req.ip || '127.0.0.1',
    });

    return successResponse(res, { course: course.toJSON() }, 'Course created successfully', 201);
  } catch (err) {
    return next(err);
  }
}

/**
 * Update course details or publication status (Admin only)
 * PATCH /api/v1/admin/courses/:id
 */
export async function adminUpdateCourse(req, res, next) {
  try {
    const { id } = req.params;
    const { title, description, category, difficulty, status, learningObjectives } = req.body;

    const course = await Course.findById(id);
    if (!course) {
      return errorResponse(res, 'Course not found', 'NOT_FOUND', 404);
    }

    if (title !== undefined) course.title = title.trim();
    if (description !== undefined) course.description = description.trim();
    if (category !== undefined && COURSE_CATEGORIES.includes(category)) course.category = category;
    if (difficulty !== undefined && DIFFICULTY_LEVELS.includes(difficulty)) course.difficulty = difficulty;
    if (status !== undefined && ['draft', 'published', 'archived'].includes(status)) course.status = status;
    if (learningObjectives !== undefined && Array.isArray(learningObjectives)) course.learningObjectives = learningObjectives;

    course.updatedBy = req.user._id;
    await course.save();

    logAuditEvent({
      actor: req.user,
      action: course.status === 'published' ? 'COURSE_PUBLISHED' : 'COURSE_UPDATED',
      targetType: 'Course',
      targetId: course._id,
      details: { title: course.title, status: course.status },
      ipAddress: req.ip || '127.0.0.1',
    });

    return successResponse(res, { course: course.toJSON() }, 'Course updated successfully');
  } catch (err) {
    return next(err);
  }
}

/**
 * Create lesson under a course (Admin only)
 * POST /api/v1/admin/courses/:courseId/lessons
 */
export async function adminCreateLesson(req, res, next) {
  try {
    const { courseId } = req.params;
    const { title, content, order, durationMinutes, sourceCitations } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return errorResponse(res, 'Parent course not found', 'NOT_FOUND', 404);
    }

    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      return errorResponse(res, 'Lesson title must be at least 3 characters', 'VALIDATION_ERROR', 400);
    }

    const currentLessonCount = await Lesson.countDocuments({ courseId });
    const lessonOrder = order !== undefined ? parseInt(order, 10) : currentLessonCount + 1;

    const lesson = new Lesson({
      courseId,
      title: title.trim(),
      content: typeof content === 'string' ? content.trim() : '',
      order: lessonOrder,
      durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : 5,
      sourceCitations: Array.isArray(sourceCitations) ? sourceCitations : [],
      status: 'published',
    });

    await lesson.save();

    return successResponse(res, { lesson: lesson.toJSON() }, 'Lesson created successfully', 201);
  } catch (err) {
    return next(err);
  }
}

/**
 * Update lesson details or publication status (Admin only)
 * PATCH /api/v1/admin/lessons/:id
 */
export async function adminUpdateLesson(req, res, next) {
  try {
    const { id } = req.params;
    const { title, content, order, status, durationMinutes } = req.body;

    const lesson = await Lesson.findById(id);
    if (!lesson) {
      return errorResponse(res, 'Lesson not found', 'NOT_FOUND', 404);
    }

    if (title !== undefined) lesson.title = title.trim();
    if (content !== undefined) lesson.content = content.trim();
    if (order !== undefined) lesson.order = parseInt(order, 10);
    if (status !== undefined && ['draft', 'published', 'archived'].includes(status)) lesson.status = status;
    if (durationMinutes !== undefined) lesson.durationMinutes = parseInt(durationMinutes, 10);

    await lesson.save();

    return successResponse(res, { lesson: lesson.toJSON() }, 'Lesson updated successfully');
  } catch (err) {
    return next(err);
  }
}

/**
 * Upload educational PDF material (Admin only)
 * POST /api/v1/admin/materials/upload
 */
export async function adminUploadMaterial(req, res, next) {
  try {
    if (!req.file) {
      return errorResponse(res, 'No PDF file uploaded', 'VALIDATION_ERROR', 400);
    }

    const { courseId, lessonId, title, description } = req.body;

    // Validate magic bytes
    const isValidPdf = validatePdfMagicBytes(req.file.path);
    if (!isValidPdf) {
      fs.unlinkSync(req.file.path); // Remove deceptive/malformed file immediately
      return errorResponse(
        res,
        'File validation failed: missing valid PDF magic signature (%PDF-)',
        'INVALID_FILE_SIGNATURE',
        400
      );
    }

    const material = new Material({
      originalFilename: req.file.originalname,
      storageFilename: req.file.filename,
      filePath: req.file.path,
      mimeType: 'application/pdf',
      fileSizeBytes: req.file.size,
      courseId: courseId || null,
      lessonId: lessonId || null,
      title: title ? title.trim() : req.file.originalname,
      description: description ? description.trim() : '',
      uploadedBy: req.user._id,
      status: 'published',
    });

    await material.save();

    logAuditEvent({
      actor: req.user,
      action: 'MATERIAL_UPLOADED',
      targetType: 'Material',
      targetId: material._id,
      details: { filename: material.originalFilename, courseId: material.courseId },
      ipAddress: req.ip || '127.0.0.1',
    });

    return successResponse(res, { material: material.toJSON() }, 'PDF material uploaded successfully', 201);
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return next(err);
  }
}

export default {
  getPublishedCourses,
  getPublishedCourseById,
  getPublishedLessonById,
  markLessonComplete,
  downloadMaterial,
  adminGetCourses,
  adminCreateCourse,
  adminUpdateCourse,
  adminCreateLesson,
  adminUpdateLesson,
  adminUploadMaterial,
};
