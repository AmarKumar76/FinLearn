import express from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';
import { pdfUpload } from '../utils/storage.js';
import {
  getPublishedCourses,
  getPublishedCourseById,
  getPublishedLessonById,
  markLessonComplete,
  getLearningHubSummary,
  downloadMaterial,
  adminGetCourses,
  adminCreateCourse,
  adminUpdateCourse,
  adminCreateLesson,
  adminUpdateLesson,
  adminUploadMaterial,
} from '../controllers/course.controller.js';

const router = express.Router();

// All learning routes require an authenticated session
router.use(requireAuth);

// Learner Public/Catalog APIs
router.get('/courses/hub-summary', getLearningHubSummary);
router.get('/courses', getPublishedCourses);
router.get('/courses/:id', getPublishedCourseById);
router.get('/lessons/:id', getPublishedLessonById);
router.post('/lessons/:id/progress', markLessonComplete);
router.get('/materials/:id/download', downloadMaterial);

// Admin-Only Content Management APIs
router.get('/admin/courses', requireAdmin, adminGetCourses);
router.post('/admin/courses', requireAdmin, adminCreateCourse);
router.patch('/admin/courses/:id', requireAdmin, adminUpdateCourse);
router.post('/admin/courses/:courseId/lessons', requireAdmin, adminCreateLesson);
router.patch('/admin/lessons/:id', requireAdmin, adminUpdateLesson);
router.post('/admin/materials/upload', requireAdmin, pdfUpload.single('file'), adminUploadMaterial);

export default router;
