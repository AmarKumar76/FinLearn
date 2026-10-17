import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import config from '../src/config/env.js';
import { createApp } from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Course } from '../src/models/course.model.js';
import { Lesson } from '../src/models/lesson.model.js';
import { Material } from '../src/models/material.model.js';
import { LearnerProgress } from '../src/models/progress.model.js';
import { generateToken } from '../src/utils/token.js';

test('FinLearn Phase 5 Learning Lab & Content Management Suite', async (suite) => {
  let app;
  let server;
  let baseUrl;

  let adminUser;
  let learnerUser;
  let adminToken;
  let learnerToken;

  suite.before(async () => {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(config.mongodbUri, { serverSelectionTimeoutMS: 5000 });
    }

    // Clean up only test records so standard curriculum is preserved
    const testCourseTitles = ['Money Management Fundamentals', 'Hacked Course Attempt'];
    const testCourses = await Course.find({ title: { $in: testCourseTitles } });
    const testCourseIds = testCourses.map((c) => c._id);

    await Promise.all([
      User.deleteMany({ email: { $regex: /@learntest\.local$/i } }),
      Course.deleteMany({ title: { $in: testCourseTitles } }),
      Lesson.deleteMany({ courseId: { $in: testCourseIds } }),
      Material.deleteMany({ courseId: { $in: testCourseIds } }),
      LearnerProgress.deleteMany({ courseId: { $in: testCourseIds } }),
    ]);

    // Create Admin
    adminUser = new User({
      name: 'Curriculum Director',
      email: 'admin@learntest.local',
      passwordHash: 'ValidPassword123!',
      role: 'admin',
    });
    await adminUser.save();
    adminToken = generateToken(adminUser);

    // Create Learner
    learnerUser = new User({
      name: 'Priya Sharma',
      email: 'priya@learntest.local',
      passwordHash: 'ValidPassword123!',
      role: 'user',
    });
    await learnerUser.save();
    learnerToken = generateToken(learnerUser);

    app = createApp();
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  suite.after(async () => {
    const testCourseTitles = ['Money Management Fundamentals', 'Hacked Course Attempt'];
    const testCourses = await Course.find({ title: { $in: testCourseTitles } });
    const testCourseIds = testCourses.map((c) => c._id);

    await Promise.all([
      User.deleteMany({ email: { $regex: /@learntest\.local$/i } }),
      Course.deleteMany({ title: { $in: testCourseTitles } }),
      Lesson.deleteMany({ courseId: { $in: testCourseIds } }),
      Material.deleteMany({ courseId: { $in: testCourseIds } }),
      LearnerProgress.deleteMany({ courseId: { $in: testCourseIds } }),
    ]);
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  });

  // ==========================================
  // 1. COURSE CREATION & PERMISSIONS
  // ==========================================
  let draftCourseId;
  let publishedCourseId;

  await suite.test('LEARN-ADM-01: Admin can create course in draft state', async () => {
    const res = await fetch(`${baseUrl}/api/v1/learning/admin/courses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Money Management Fundamentals',
        description: 'Master budgeting, emergency funds, and basic banking safety in India.',
        category: 'Budgeting',
        difficulty: 'Beginner',
        language: 'en',
        learningObjectives: ['Understand needs vs wants', 'Build a 3-month emergency fund'],
      }),
    });

    const body = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(body.data.course.status, 'draft');
    assert.strictEqual(body.data.course.title, 'Money Management Fundamentals');
    draftCourseId = body.data.course.id;
  });

  await suite.test('LEARN-001: Ordinary learner cannot create course (RBAC 403)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/learning/admin/courses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${learnerToken}`,
      },
      body: JSON.stringify({
        title: 'Hacked Course Attempt',
        description: 'Should fail with 403 Forbidden',
        category: 'Budgeting',
      }),
    });

    assert.strictEqual(res.status, 403);
  });

  await suite.test('LEARN-002: Ordinary learner cannot view draft or unpublished courses', async () => {
    // 1. Learner list published courses: the draft course must NOT be included in the published list
    const listRes = await fetch(`${baseUrl}/api/v1/learning/courses`, {
      headers: { Authorization: `Bearer ${learnerToken}` },
    });
    const listBody = await listRes.json();
    assert.strictEqual(listRes.status, 200);
    const draftFound = listBody.data.courses.some((c) => c.id === draftCourseId || c.title === 'Money Management Fundamentals');
    assert.strictEqual(draftFound, false, 'Draft course must not appear in published courses list');

    // 2. Learner direct fetch draft course: must return 404
    const getRes = await fetch(`${baseUrl}/api/v1/learning/courses/${draftCourseId}`, {
      headers: { Authorization: `Bearer ${learnerToken}` },
    });
    assert.strictEqual(getRes.status, 404);
  });

  // ==========================================
  // 2. LESSONS & PUBLISHING
  // ==========================================
  let lesson1Id;
  let lesson2Id;

  await suite.test('LEARN-ADM-02: Admin creates lessons and publishes course', async () => {
    // Create Lesson 1
    const l1Res = await fetch(`${baseUrl}/api/v1/learning/admin/courses/${draftCourseId}/lessons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Needs vs Wants in the Indian Context',
        content: 'Analyzing household expenditures and prioritizing essential living costs...',
        durationMinutes: 7,
      }),
    });
    const l1Body = await l1Res.json();
    assert.strictEqual(l1Res.status, 201);
    lesson1Id = l1Body.data.lesson.id;

    // Create Lesson 2
    const l2Res = await fetch(`${baseUrl}/api/v1/learning/admin/courses/${draftCourseId}/lessons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'The 50/30/20 Rule for Indian Earners',
        content: 'Allocating net income across necessities, discretionary choices, and savings...',
        durationMinutes: 10,
      }),
    });
    const l2Body = await l2Res.json();
    assert.strictEqual(l2Res.status, 201);
    lesson2Id = l2Body.data.lesson.id;

    // Publish Course
    const pubRes = await fetch(`${baseUrl}/api/v1/learning/admin/courses/${draftCourseId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'published' }),
    });
    const pubBody = await pubRes.json();
    assert.strictEqual(pubRes.status, 200);
    assert.strictEqual(pubBody.data.course.status, 'published');
    publishedCourseId = draftCourseId;
  });

  await suite.test('LEARN-003: Learner can view published course and ordered lessons', async () => {
    const res = await fetch(`${baseUrl}/api/v1/learning/courses/${publishedCourseId}`, {
      headers: { Authorization: `Bearer ${learnerToken}` },
    });
    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.data.course.id, publishedCourseId);
    assert.strictEqual(body.data.lessons.length, 2);
    assert.strictEqual(body.data.lessons[0].order, 1);
    assert.strictEqual(body.data.lessons[1].order, 2);
  });

  // ==========================================
  // 3. LEARNER PROGRESS PERSISTENCE
  // ==========================================
  await suite.test('LEARN-PROG-01: Learner completes lesson 1; progress updates to 50%', async () => {
    const res = await fetch(`${baseUrl}/api/v1/learning/lessons/${lesson1Id}/progress`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${learnerToken}` },
    });
    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.data.courseProgress.totalLessons, 2);
    assert.strictEqual(body.data.courseProgress.completedLessons, 1);
    assert.strictEqual(body.data.courseProgress.progressPct, 50);

    // Duplicate submission should be idempotent
    const dupRes = await fetch(`${baseUrl}/api/v1/learning/lessons/${lesson1Id}/progress`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${learnerToken}` },
    });
    const dupBody = await dupRes.json();
    assert.strictEqual(dupRes.status, 200);
    assert.strictEqual(dupBody.data.courseProgress.progressPct, 50);
  });

  // ==========================================
  // 4. PDF MATERIAL UPLOAD, VALIDATION & ACCESS
  // ==========================================
  let materialId;

  await suite.test('LEARN-003-SEC: Rejection of non-PDF or spoofed files without %PDF- magic signature', async () => {
    // Create temporary fake text file renamed to .pdf
    const fakePdfPath = path.resolve(process.cwd(), 'fake_test.pdf');
    fs.writeFileSync(fakePdfPath, 'This is plain text without pdf signature');

    const formBoundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const formBody = Buffer.concat([
      Buffer.from(`--${formBoundary}\r\nContent-Disposition: form-data; name="file"; filename="fake.pdf"\r\nContent-Type: application/pdf\r\n\r\n`),
      fs.readFileSync(fakePdfPath),
      Buffer.from(`\r\n--${formBoundary}--\r\n`),
    ]);

    const res = await fetch(`${baseUrl}/api/v1/learning/admin/materials/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': `multipart/form-data; boundary=${formBoundary}`,
      },
      body: formBody,
    });

    const body = await res.json();
    assert.strictEqual(res.status, 400);
    assert.strictEqual(body.code, 'INVALID_FILE_SIGNATURE');

    if (fs.existsSync(fakePdfPath)) fs.unlinkSync(fakePdfPath);
  });

  await suite.test('LEARN-MAT-01: Admin uploads valid PDF with magic bytes; learner can stream/download', async () => {
    // Create authentic minimal PDF file with %PDF- header
    const validPdfPath = path.resolve(process.cwd(), 'valid_test.pdf');
    const validPdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');
    fs.writeFileSync(validPdfPath, validPdfBuffer);

    const formBoundary = '----WebKitFormBoundaryValidPdf';
    const formBody = Buffer.concat([
      Buffer.from(`--${formBoundary}\r\nContent-Disposition: form-data; name="courseId"\r\n\r\n${publishedCourseId}\r\n`),
      Buffer.from(`--${formBoundary}\r\nContent-Disposition: form-data; name="title"\r\n\r\nRBI Guidelines on Deposit Safety\r\n`),
      Buffer.from(`--${formBoundary}\r\nContent-Disposition: form-data; name="file"; filename="rbi_deposit_safety.pdf"\r\nContent-Type: application/pdf\r\n\r\n`),
      validPdfBuffer,
      Buffer.from(`\r\n--${formBoundary}--\r\n`),
    ]);

    const res = await fetch(`${baseUrl}/api/v1/learning/admin/materials/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': `multipart/form-data; boundary=${formBoundary}`,
      },
      body: formBody,
    });

    const body = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(body.data.material.originalFilename, 'rbi_deposit_safety.pdf');
    assert.strictEqual(body.data.material.filePath, undefined, 'Internal filePath must never be exposed');
    materialId = body.data.material.id;

    // Learner downloads the material
    const dlRes = await fetch(`${baseUrl}/api/v1/learning/materials/${materialId}/download`, {
      headers: { Authorization: `Bearer ${learnerToken}` },
    });
    assert.strictEqual(dlRes.status, 200);
    assert.strictEqual(dlRes.headers.get('content-type'), 'application/pdf');

    // Clean up temporary local test file
    if (fs.existsSync(validPdfPath)) fs.unlinkSync(validPdfPath);
  });
});
