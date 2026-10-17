import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import config from '../src/config/env.js';
import { createApp } from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Quiz } from '../src/models/quiz.model.js';
import { Course } from '../src/models/course.model.js';
import { Lesson } from '../src/models/lesson.model.js';
import { LearnerProgress } from '../src/models/progress.model.js';
import { QuizAttempt } from '../src/models/quizAttempt.model.js';
import { GamificationProfile } from '../src/models/gamification.model.js';
import { generateToken } from '../src/utils/token.js';
import { getKolkataDateString, getDaysDifference } from '../src/utils/gamification.js';

test('FinLearn Phase 6 Quizzes, Assessments & Gamification Suite', async (suite) => {
  let app;
  let server;
  let baseUrl;

  let adminUser;
  let learnerA;
  let learnerB;
  let adminToken;
  let learnerAToken;
  let learnerBToken;

  let createdQuizId;
  let question1Id;
  let question2Id;

  suite.before(async () => {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(config.mongodbUri, { serverSelectionTimeoutMS: 5000 });
    }

    // Clean up test records
    await Promise.all([
      User.deleteMany({ email: { $regex: /@quiztest\.local$/i } }),
      Quiz.deleteMany({}),
      QuizAttempt.deleteMany({}),
      GamificationProfile.deleteMany({}),
      Course.deleteMany({ title: { $regex: /Practice Test Course/i } }),
    ]);

    // Admin
    adminUser = new User({
      name: 'Quiz Administrator',
      email: 'admin@quiztest.local',
      passwordHash: 'ValidPassword123!',
      role: 'admin',
    });
    await adminUser.save();
    adminToken = generateToken(adminUser);

    // Learner A
    learnerA = new User({
      name: 'Learner A',
      email: 'learnerA@quiztest.local',
      passwordHash: 'ValidPassword123!',
      role: 'user',
    });
    await learnerA.save();
    learnerAToken = generateToken(learnerA);

    // Learner B
    learnerB = new User({
      name: 'Learner B',
      email: 'learnerB@quiztest.local',
      passwordHash: 'ValidPassword123!',
      role: 'user',
    });
    await learnerB.save();
    learnerBToken = generateToken(learnerB);

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
    await Promise.all([
      User.deleteMany({ email: { $regex: /@quiztest\.local$/i } }),
      Quiz.deleteMany({}),
      QuizAttempt.deleteMany({}),
      GamificationProfile.deleteMany({}),
    ]);
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  });

  // 1. Admin Quiz Creation in Draft State
  await suite.test('QUIZ-ADM-01: Admin can create quiz in draft state', async () => {
    const res = await fetch(`${baseUrl}/api/v1/assessment/admin/quizzes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'GST & Indirect Taxes Assessment',
        description: 'Test your understanding of GST concepts in India.',
        category: 'Budgeting',
        difficulty: 'Beginner',
        passingScorePercent: 60,
        status: 'draft',
        questions: [
          {
            questionText: 'What does GST stand for in India?',
            questionType: 'mcq',
            options: [
              'General Sales Tax',
              'Goods and Services Tax',
              'Government Service Tax',
              'Grand Savings Target',
            ],
            correctAnswerIndex: 1,
            explanation: 'GST stands for Goods and Services Tax, implemented on July 1, 2017.',
            points: 10,
          },
          {
            questionText: 'Is GST an indirect tax?',
            questionType: 'true_false',
            options: ['True', 'False'],
            correctAnswerIndex: 0,
            explanation: 'Yes, GST is an indirect tax levied on the supply of goods and services.',
            points: 10,
          },
        ],
      }),
    });

    assert.equal(res.status, 201);
    const json = await res.json();
    assert.equal(json.status, 'success');
    assert.equal(json.data.quiz.status, 'draft');
    assert.equal(json.data.quiz.questions.length, 2);
    createdQuizId = json.data.quiz.id;
    question1Id = json.data.quiz.questions[0]._id;
    question2Id = json.data.quiz.questions[1]._id;
  });

  // 2. RBAC: Ordinary User Cannot Create Quiz
  await suite.test('QUIZ-RBAC-01: Ordinary user cannot create or manage quizzes (RBAC 403)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/assessment/admin/quizzes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${learnerAToken}`,
      },
      body: JSON.stringify({
        title: 'Hacked Quiz',
        description: 'Exploit attempt',
      }),
    });

    assert.equal(res.status, 403);
    const json = await res.json();
    assert.equal(json.code, 'FORBIDDEN');
  });

  // 3. Learner Cannot View Draft Quizzes
  await suite.test('QUIZ-VIS-01: Learner cannot view draft or unpublished quizzes', async () => {
    // List should be empty
    const listRes = await fetch(`${baseUrl}/api/v1/assessment/quizzes`, {
      headers: { Authorization: `Bearer ${learnerAToken}` },
    });
    assert.equal(listRes.status, 200);
    const listJson = await listRes.json();
    assert.equal(listJson.data.quizzes.length, 0);

    // Direct access to draft quiz ID should return 404
    const getRes = await fetch(`${baseUrl}/api/v1/assessment/quizzes/${createdQuizId}`, {
      headers: { Authorization: `Bearer ${learnerAToken}` },
    });
    assert.equal(getRes.status, 404);
  });

  // 4. Admin Publishes Quiz
  await suite.test('QUIZ-ADM-02: Admin publishes quiz; learner can view without answers exposed', async () => {
    const pubRes = await fetch(`${baseUrl}/api/v1/assessment/admin/quizzes/${createdQuizId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'published' }),
    });

    assert.equal(pubRes.status, 200);
    const pubJson = await pubRes.json();
    assert.equal(pubJson.data.quiz.status, 'published');

    // Learner accesses published quiz
    const getRes = await fetch(`${baseUrl}/api/v1/assessment/quizzes/${createdQuizId}`, {
      headers: { Authorization: `Bearer ${learnerAToken}` },
    });
    assert.equal(getRes.status, 200);
    const getJson = await getRes.json();
    const quiz = getJson.data.quiz;

    assert.equal(quiz.title, 'GST & Indirect Taxes Assessment');
    assert.equal(quiz.questions.length, 2);

    // CRITICAL SECURITY INVARIANT: Ensure correctAnswerIndex and explanation are NOT in learner payload
    quiz.questions.forEach((q) => {
      assert.equal(q.correctAnswerIndex, undefined, 'correctAnswerIndex must NEVER leak to client');
      assert.equal(q.explanation, undefined, 'explanation must NEVER leak before submission');
    });
  });

  // 5. Learner Submits Correct Answers -> 100% Score & XP Awarded
  await suite.test('QUIZ-EVAL-01: Server-calculated score for all correct answers (100%), XP and badges awarded', async () => {
    const submitRes = await fetch(`${baseUrl}/api/v1/assessment/quizzes/${createdQuizId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${learnerAToken}`,
      },
      body: JSON.stringify({
        answers: [
          { questionId: question1Id, selectedOptionIndex: 1 }, // Correct (10 pts)
          { questionId: question2Id, selectedOptionIndex: 0 }, // Correct (10 pts)
        ],
      }),
    });

    assert.equal(submitRes.status, 200);
    const json = await submitRes.json();
    assert.equal(json.data.score, 20);
    assert.equal(json.data.maxScore, 20);
    assert.equal(json.data.scorePercentage, 100);
    assert.equal(json.data.passed, true);

    // Gamification verification:
    // Min attempt (10) + Pass bonus (50) + Perfect score bonus (25) = 85 XP
    assert.equal(json.data.xpAwarded, 85);
    assert.ok(json.data.review.length === 2);
    assert.equal(json.data.review[0].isCorrect, true);
    assert.equal(json.data.review[1].isCorrect, true);

    // Badges awarded: FIRST_QUIZ, QUIZ_MASTER, PERFECT_SCORE
    const badgeIds = json.data.newBadges.map((b) => b.id);
    assert.ok(badgeIds.includes('FIRST_QUIZ'));
    assert.ok(badgeIds.includes('QUIZ_MASTER'));
    assert.ok(badgeIds.includes('PERFECT_SCORE'));
  });

  // 6. Anti-Farming: Repeated submission does not duplicate Pass/Perfect XP
  await suite.test('QUIZ-XP-02: Repeat submission does not farm duplicate pass/perfect bonus XP', async () => {
    const repeatRes = await fetch(`${baseUrl}/api/v1/assessment/quizzes/${createdQuizId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${learnerAToken}`,
      },
      body: JSON.stringify({
        answers: [
          { questionId: question1Id, selectedOptionIndex: 1 },
          { questionId: question2Id, selectedOptionIndex: 0 },
        ],
      }),
    });

    assert.equal(repeatRes.status, 200);
    const json = await repeatRes.json();
    // Only base attempt XP (10) awarded, not duplicate pass (50) or perfect (25)
    assert.equal(json.data.xpAwarded, 10);
    assert.equal(json.data.newBadges.length, 0); // No duplicate badges
  });

  // 7. Failing Assessment (0% or below pass criteria)
  await suite.test('QUIZ-EVAL-02: Server-calculated score for failing attempt', async () => {
    const failRes = await fetch(`${baseUrl}/api/v1/assessment/quizzes/${createdQuizId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${learnerBToken}`,
      },
      body: JSON.stringify({
        answers: [
          { questionId: question1Id, selectedOptionIndex: 0 }, // Incorrect
          { questionId: question2Id, selectedOptionIndex: 1 }, // Incorrect
        ],
      }),
    });

    assert.equal(failRes.status, 200);
    const json = await failRes.json();
    assert.equal(json.data.score, 0);
    assert.equal(json.data.scorePercentage, 0);
    assert.equal(json.data.passed, false);
    // Base attempt XP (10) awarded, no pass bonus
    assert.equal(json.data.xpAwarded, 10);
  });

  // 8. BOLA / Data Isolation: Learner B cannot view Learner A attempt review
  await suite.test('QUIZ-BOLA-01: Learner B cannot access Learner A attempt review (BOLA 403)', async () => {
    // Get Learner A's attempt
    const attempts = await QuizAttempt.find({ userId: learnerA._id });
    assert.ok(attempts.length > 0);
    const learnerAAttemptId = attempts[0]._id.toString();

    // Learner B requests Learner A's attempt
    const res = await fetch(`${baseUrl}/api/v1/assessment/quizzes/attempts/${learnerAAttemptId}`, {
      headers: { Authorization: `Bearer ${learnerBToken}` },
    });

    assert.equal(res.status, 403);
    const json = await res.json();
    assert.equal(json.code, 'FORBIDDEN');
  });

  // 9. Validation: Rejection of malformed question ID or invalid option index
  await suite.test('QUIZ-VAL-01: Rejection of invalid question IDs and out-of-range option indices', async () => {
    const res = await fetch(`${baseUrl}/api/v1/assessment/quizzes/${createdQuizId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${learnerAToken}`,
      },
      body: JSON.stringify({
        answers: [
          { questionId: question1Id, selectedOptionIndex: 99 }, // Out of range index
        ],
      }),
    });

    assert.equal(res.status, 400);
    const json = await res.json();
    assert.equal(json.code, 'VALIDATION_ERROR');
  });

  // 10. Gamification Streak Calculation Unit Logic
  await suite.test('GAME-STRK-01: Streak calculation handles same day, consecutive day, and gap days', async () => {
    // Same day difference
    const sameDayDiff = getDaysDifference('2026-10-13', '2026-10-13');
    assert.equal(sameDayDiff, 0);

    // Consecutive day difference
    const consecutiveDiff = getDaysDifference('2026-10-14', '2026-10-13');
    assert.equal(consecutiveDiff, 1);

    // Missed days difference
    const missedDiff = getDaysDifference('2026-10-16', '2026-10-13');
    assert.equal(missedDiff, 3);
  });

  // 11. Practice Quiz Generation: Incomplete module rejection
  let practiceCourse;
  let practiceLesson1;
  let practiceLesson2;

  await suite.test('PRACTICE-01: Module with incomplete lessons rejects practice quiz generation (403)', async () => {
    practiceCourse = new Course({
      title: 'Practice Test Course: Banking Security',
      description: 'Educational module on banking security and cyber hygiene.',
      category: 'Banking & Digital Safety',
      difficulty: 'Beginner',
      status: 'published',
      createdBy: adminUser._id,
    });
    await practiceCourse.save();

    practiceLesson1 = new Lesson({
      courseId: practiceCourse._id,
      title: 'Never Share UPI PIN',
      content: 'A UPI PIN is only needed to send money or check balance. You never enter a PIN to receive payments.',
      order: 1,
      status: 'published',
    });
    await practiceLesson1.save();

    practiceLesson2 = new Lesson({
      courseId: practiceCourse._id,
      title: 'Spotting Phishing SMS Links',
      content: 'Bank communications never ask you to update KYC via APK files or unofficial bit.ly shortened links.',
      order: 2,
      status: 'published',
    });
    await practiceLesson2.save();

    // Mark only lesson 1 as completed for learnerA
    const prog1 = new LearnerProgress({
      userId: learnerA._id,
      courseId: practiceCourse._id,
      lessonId: practiceLesson1._id,
      isCompleted: true,
    });
    await prog1.save();

    // Request practice quiz while lesson 2 is incomplete
    const res = await fetch(`${baseUrl}/api/v1/assessment/quizzes/generate-practice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${learnerAToken}`,
      },
      body: JSON.stringify({
        courseId: practiceCourse._id.toString(),
        questionCount: 3,
      }),
    });

    assert.equal(res.status, 403);
    const json = await res.json();
    assert.equal(json.code, 'FORBIDDEN');
  });

  // 12. Practice Quiz Generation: Completed module success
  let generatedPracticeQuizId;
  await suite.test('PRACTICE-02: Completed module successfully generates practice quiz grounded in lessons', async () => {
    // Complete lesson 2
    const prog2 = new LearnerProgress({
      userId: learnerA._id,
      courseId: practiceCourse._id,
      lessonId: practiceLesson2._id,
      isCompleted: true,
    });
    await prog2.save();

    const res = await fetch(`${baseUrl}/api/v1/assessment/quizzes/generate-practice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${learnerAToken}`,
      },
      body: JSON.stringify({
        courseId: practiceCourse._id.toString(),
        difficulty: 'Beginner',
        questionCount: 2,
      }),
    });

    assert.equal(res.status, 201);
    const json = await res.json();
    assert.equal(json.status, 'success');
    assert.ok(json.data.quizId);
    assert.equal(json.data.quiz.isPractice, true);
    assert.equal(json.data.quiz.isAiGenerated, true);
    assert.equal(json.data.quiz.status, 'published');
    assert.ok(json.data.quiz.questions.length >= 2);

    generatedPracticeQuizId = json.data.quizId;
  });

  // 13. Practice Quizzes Isolated from Public Catalog
  await suite.test('PRACTICE-03: Generated practice quizzes do not leak into general quiz catalog', async () => {
    const res = await fetch(`${baseUrl}/api/v1/assessment/quizzes`, {
      headers: { Authorization: `Bearer ${learnerAToken}` },
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    const foundPractice = json.data.quizzes.some((q) => (q.id || q._id) === generatedPracticeQuizId);
    assert.equal(foundPractice, false, 'Practice quiz should not appear in official public catalog');
  });

  // 14. Learner can take practice quiz and submit for authoritative grading
  await suite.test('PRACTICE-04: Student can take practice quiz, answers remain hidden before submit', async () => {
    // Fetch quiz by id
    const res = await fetch(`${baseUrl}/api/v1/assessment/quizzes/${generatedPracticeQuizId}`, {
      headers: { Authorization: `Bearer ${learnerAToken}` },
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.ok(json.data.quiz);

    // Verify correct answers and explanations are not leaked
    json.data.quiz.questions.forEach((q) => {
      assert.equal(q.correctAnswerIndex, undefined);
      assert.equal(q.explanation, undefined);
    });

    // Submit attempt
    const submitRes = await fetch(`${baseUrl}/api/v1/assessment/quizzes/${generatedPracticeQuizId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${learnerAToken}`,
      },
      body: JSON.stringify({
        answers: json.data.quiz.questions.map((q) => ({
          questionId: q.id || q._id,
          selectedOptionIndex: 0,
        })),
      }),
    });

    assert.equal(submitRes.status, 200);
    const submitJson = await submitRes.json();
    assert.ok(typeof submitJson.data.scorePercentage === 'number');
    assert.ok(Array.isArray(submitJson.data.review));
  });

  // 15. Invalid module ID or non-existent course rejected
  await suite.test('PRACTICE-05: Non-existent module ID or invalid format rejected', async () => {
    const res = await fetch(`${baseUrl}/api/v1/assessment/quizzes/generate-practice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${learnerAToken}`,
      },
      body: JSON.stringify({
        courseId: 'invalid-id-format',
      }),
    });
    assert.equal(res.status, 400);

    const randomId = new mongoose.Types.ObjectId();
    const notFoundRes = await fetch(`${baseUrl}/api/v1/assessment/quizzes/generate-practice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${learnerAToken}`,
      },
      body: JSON.stringify({
        courseId: randomId.toString(),
      }),
    });
    assert.equal(notFoundRes.status, 404);
  });
});
