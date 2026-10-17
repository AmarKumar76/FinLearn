/**
 * FinLearn Curriculum Content Seeder
 * 
 * Safely seeds and updates the 10 core financial literacy courses and 30 lessons.
 * 
 * Invariants:
 * 1. Safe & Repeatable: Rerunning does NOT create duplicate courses or lessons.
 * 2. Learner Progress Preservation: Matches existing courses/lessons by title & order,
 *    updating fields in place so existing learner progress IDs remain intact.
 * 3. Publishes all 10 courses and 30 lessons so they are instantly visible in Learning Hub.
 * 4. Syncs the RAG knowledge chunks for AI money coach searchability.
 * 
 * Usage:
 *   node scripts/seedCurriculum.js
 */

import mongoose from 'mongoose';
import { connectDatabase } from '../src/config/database.js';
import { User } from '../src/models/user.model.js';
import { Course } from '../src/models/course.model.js';
import { Lesson } from '../src/models/lesson.model.js';
import { allCurriculumCourses } from '../src/data/curriculumData.js';
import { syncKnowledgeBase } from '../src/utils/ragPipeline.js';

export async function seedCurriculum({ silent = false } = {}) {
  const log = (...args) => {
    if (!silent) console.log(...args);
  };

  // 1. Identify admin user to attribute course creation
  let adminUser = await User.findOne({ role: 'admin' });
  if (!adminUser) {
    adminUser = await User.findOne();
  }
  if (!adminUser) {
    throw new Error('No user account found to attribute course creation. Please provision a user first.');
  }

  log(`[SEED] Using user "${adminUser.email}" (${adminUser._id}) as content author/admin.`);

  let coursesCreated = 0;
  let coursesUpdated = 0;
  let lessonsCreated = 0;
  let lessonsUpdated = 0;

  for (const courseData of allCurriculumCourses) {
    const { lessons, ...courseFields } = courseData;

    // Check for existing course by title
    let course = await Course.findOne({ title: courseFields.title });

    if (!course) {
      course = new Course({
        ...courseFields,
        status: 'published',
        createdBy: adminUser._id,
      });
      await course.save();
      coursesCreated++;
      log(`[SEED] Created Course: "${course.title}" (${course._id})`);
    } else {
      // Update existing course metadata without altering its ID
      course.description = courseFields.description;
      course.category = courseFields.category;
      course.difficulty = courseFields.difficulty;
      course.language = courseFields.language || 'en';
      course.learningObjectives = courseFields.learningObjectives || [];
      course.status = 'published';
      course.updatedBy = adminUser._id;
      await course.save();
      coursesUpdated++;
      log(`[SEED] Updated Course: "${course.title}" (${course._id})`);
    }

    // Process lessons for this course
    for (const lessonData of lessons) {
      let lesson = await Lesson.findOne({
        courseId: course._id,
        order: lessonData.order,
      });

      if (!lesson) {
        // Also check if existing lesson had matching title
        lesson = await Lesson.findOne({
          courseId: course._id,
          title: lessonData.title,
        });
      }

      if (!lesson) {
        lesson = new Lesson({
          courseId: course._id,
          title: lessonData.title,
          content: lessonData.content,
          order: lessonData.order,
          durationMinutes: lessonData.durationMinutes || 5,
          status: 'published',
          sourceCitations: lessonData.sourceCitations || [],
        });
        await lesson.save();
        lessonsCreated++;
        log(`  [SEED] + Created Lesson ${lesson.order}: "${lesson.title}"`);
      } else {
        // Update lesson content in-place preserving its _id (so LearnerProgress remains valid)
        lesson.title = lessonData.title;
        lesson.content = lessonData.content;
        lesson.order = lessonData.order;
        lesson.durationMinutes = lessonData.durationMinutes || 5;
        lesson.status = 'published';
        lesson.sourceCitations = lessonData.sourceCitations || [];
        await lesson.save();
        lessonsUpdated++;
        log(`  [SEED] ~ Updated Lesson ${lesson.order}: "${lesson.title}"`);
      }
    }
  }

  log(`\n==========================================`);
  log(`Curriculum Seeding Summary:`);
  log(`- Courses Created: ${coursesCreated}, Updated: ${coursesUpdated} (Total: ${allCurriculumCourses.length})`);
  log(`- Lessons Created: ${lessonsCreated}, Updated: ${lessonsUpdated}`);
  log(`==========================================\n`);

  // Sync RAG Knowledge Base so AI coach has instant access to new lessons
  try {
    log('[SEED] Syncing RAG knowledge chunks for AI money coach...');
    await syncKnowledgeBase();
    log('[SEED] RAG knowledge sync complete.');
  } catch (ragErr) {
    console.error('[SEED] Warning: RAG sync failed:', ragErr.message);
  }

  return {
    coursesCreated,
    coursesUpdated,
    lessonsCreated,
    lessonsUpdated,
  };
}

// Allow direct CLI execution
if (process.argv[1]?.endsWith('seedCurriculum.js')) {
  (async () => {
    try {
      const connected = await connectDatabase();
      if (!connected) {
        console.error('Failed to connect to MongoDB.');
        process.exit(1);
      }
      await seedCurriculum();
    } catch (err) {
      console.error('Curriculum seeding failed:', err);
      process.exit(1);
    } finally {
      await mongoose.disconnect();
      process.exit(0);
    }
  })();
}
