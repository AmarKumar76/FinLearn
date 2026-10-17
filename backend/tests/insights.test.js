import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import config from '../src/config/env.js';
import { createApp } from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Transaction } from '../src/models/transaction.model.js';
import { Budget } from '../src/models/budget.model.js';
import { SavingsGoal } from '../src/models/savingsGoal.model.js';
import { Commitment } from '../src/models/commitment.model.js';
import { Course } from '../src/models/course.model.js';
import { Quiz } from '../src/models/quiz.model.js';
import { AuditLog } from '../src/models/auditLog.model.js';
import { logAuditEvent, sanitizeAuditDetails } from '../src/utils/auditLogger.js';
import { generateToken } from '../src/utils/token.js';

test('FinLearn Phase 9 Insights, Admin Analytics & Audit Logs Suite', async (suite) => {
  let app;
  let server;
  let baseUrl;
  let learnerA;
  let learnerB;
  let adminUser;
  let tokenA;
  let tokenB;
  let adminToken;

  suite.before(async () => {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(config.mongodbUri, { serverSelectionTimeoutMS: 5000 });
    }

    // Clean test artifacts
    await User.deleteMany({ email: { $in: ['insight_a@finlearn.test', 'insight_b@finlearn.test', 'insight_admin@finlearn.test'] } });
    await AuditLog.deleteMany({});
    await Course.deleteMany({ title: /Audit Test Course/ });
    await Quiz.deleteMany({ title: /Audit Test Quiz/ });

    // Create Learner A
    learnerA = new User({
      name: 'Insight Learner A',
      email: 'insight_a@finlearn.test',
      passwordHash: 'ValidPassword123!',
      role: 'user',
    });
    await learnerA.save();
    tokenA = generateToken(learnerA);

    // Create Learner B
    learnerB = new User({
      name: 'Insight Learner B',
      email: 'insight_b@finlearn.test',
      passwordHash: 'ValidPassword123!',
      role: 'user',
    });
    await learnerB.save();
    tokenB = generateToken(learnerB);

    // Create Admin User
    adminUser = new User({
      name: 'Insight Compliance Admin',
      email: 'insight_admin@finlearn.test',
      passwordHash: 'ValidPassword123!',
      role: 'admin',
    });
    await adminUser.save();
    adminToken = generateToken(adminUser);

    // Seed Learner A test financial data
    await Transaction.deleteMany({ userId: { $in: [learnerA._id, learnerB._id] } });
    await Budget.deleteMany({ userId: { $in: [learnerA._id, learnerB._id] } });
    await SavingsGoal.deleteMany({ userId: { $in: [learnerA._id, learnerB._id] } });
    await Commitment.deleteMany({ userId: { $in: [learnerA._id, learnerB._id] } });

    // Learner A Income: ₹50,000 (5,000,000 paise)
    await Transaction.create({
      userId: learnerA._id,
      title: 'Monthly Salary',
      type: 'income',
      category: 'Salary & Wages',
      amountPaise: 5000000,
      date: new Date('2026-10-01T10:00:00Z'),
      description: 'Monthly salary credited',
    });

    // Learner A Expense 1: ₹15,000 (1,500,000 paise) Rent
    await Transaction.create({
      userId: learnerA._id,
      title: 'Apartment Rent',
      type: 'expense',
      category: 'Housing & Rent',
      amountPaise: 1500000,
      date: new Date('2026-10-05T10:00:00Z'),
      description: 'Apartment rent',
    });

    // Learner A Expense 2: ₹5,000 (500,000 paise) Groceries
    await Transaction.create({
      userId: learnerA._id,
      title: 'Weekly Groceries',
      type: 'expense',
      category: 'Food & Groceries',
      amountPaise: 500000,
      date: new Date('2026-10-10T10:00:00Z'),
      description: 'Weekly grocery store purchase',
    });

    // Learner A Expense 3 in different month (September): ₹2,000 (200,000 paise)
    await Transaction.create({
      userId: learnerA._id,
      title: 'September Power Bill',
      type: 'expense',
      category: 'Utilities & Bills',
      amountPaise: 200000,
      date: new Date('2026-09-15T10:00:00Z'),
      description: 'September Electricity Bill',
    });

    // Learner A Budget: Rent budget ₹20,000 (2,000,000 paise)
    await Budget.create({
      userId: learnerA._id,
      category: 'Housing & Rent',
      limitPaise: 2000000,
      period: '2026-10',
      startDate: new Date('2026-10-01'),
      endDate: new Date('2026-10-31'),
    });

    // Learner A Savings Goal: Emergency Fund ₹100,000 (10,000,000 paise), saved ₹30,000
    await SavingsGoal.create({
      userId: learnerA._id,
      name: 'Emergency Fund 3 Months',
      targetPaise: 10000000,
      savedPaise: 3000000,
      targetDate: new Date('2027-04-01'),
    });

    // Learner A Commitment: SIP ₹5,000 (500,000 paise)
    await Commitment.create({
      userId: learnerA._id,
      title: 'Index Fund SIP',
      type: 'SIP',
      amountPaise: 500000,
      recurrence: 'Monthly',
      dueDate: new Date('2026-10-25'),
    });

    // Learner B Financial data (isolated)
    await Transaction.create({
      userId: learnerB._id,
      title: 'Client Consulting Fee',
      type: 'income',
      category: 'Freelance & Consulting',
      amountPaise: 8000000,
      date: new Date('2026-10-02T10:00:00Z'),
      description: 'Client payment',
    });

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
    await User.deleteMany({ email: { $in: ['insight_a@finlearn.test', 'insight_b@finlearn.test', 'insight_admin@finlearn.test'] } });
    await Transaction.deleteMany({ userId: { $in: [learnerA?._id, learnerB?._id] } });
    await Budget.deleteMany({ userId: { $in: [learnerA?._id, learnerB?._id] } });
    await SavingsGoal.deleteMany({ userId: { $in: [learnerA?._id, learnerB?._id] } });
    await Commitment.deleteMany({ userId: { $in: [learnerA?._id, learnerB?._id] } });
    await AuditLog.deleteMany({});
    await Course.deleteMany({ title: /Audit Test Course/ });
    await Quiz.deleteMany({ title: /Audit Test Quiz/ });
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  });

  // Test 1: User financial report reconciles with stored records
  await suite.test('INSIGHT-01: User insights calculate accurate integer paise income, expense, and net savings', async () => {
    const res = await fetch(`${baseUrl}/api/v1/insights`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.status, 'success');

    const { summary, categoryBreakdown, budgets, savingsGoals, commitments } = json.data;

    // Total income: 5,000,000 paise
    assert.equal(summary.totalIncomePaise, 5000000);
    // Total expenses: 1,500,000 + 500,000 + 200,000 = 2,200,000 paise
    assert.equal(summary.totalExpensePaise, 2200000);
    // Net savings: 5,000,000 - 2,200,000 = 2,800,000 paise
    assert.equal(summary.netSavingsPaise, 2800000);
    // Savings rate: 2,800,000 / 5,000,000 = 56%
    assert.equal(summary.savingsRatePercent, 56);

    // Verify category breakdown sums to total expenses
    const breakdownSum = categoryBreakdown.reduce((sum, c) => sum + c.amountPaise, 0);
    assert.equal(breakdownSum, 2200000);

    // Verify budget reconciliation
    assert.equal(budgets.length, 1);
    assert.equal(budgets[0].category, 'Housing & Rent');
    assert.equal(budgets[0].budgetPaise, 2000000);
    assert.equal(budgets[0].spentPaise, 1500000);
    assert.equal(budgets[0].utilizationPercent, 75);

    // Verify savings goal
    assert.equal(savingsGoals.length, 1);
    assert.equal(savingsGoals[0].progressPercent, 30);

    // Verify commitments
    assert.equal(commitments.totalMonthlyCommitmentsPaise, 500000);
  });

  // Test 2: Date filters restrict calculations to requested timeframe
  await suite.test('INSIGHT-02: Date range filtering restricts transactions and categories to requested period', async () => {
    const res = await fetch(`${baseUrl}/api/v1/insights?startDate=2026-10-01&endDate=2026-10-31`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    const { summary, categoryBreakdown } = json.data;

    // October expenses only: 1,500,000 + 500,000 = 2,000,000 paise (September 200,000 excluded)
    assert.equal(summary.totalExpensePaise, 2000000);
    assert.equal(categoryBreakdown.some((c) => c.category === 'Utilities & Bills'), false, 'September utility bill excluded');
  });

  // Test 3: User B cannot access User A's insights data (BOLA isolation)
  await suite.test('INSIGHT-03: BOLA/IDOR prevention — User B receives strictly their own financial insights', async () => {
    const resB = await fetch(`${baseUrl}/api/v1/insights`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });

    assert.equal(resB.status, 200);
    const jsonB = await resB.json();
    const { summary, categoryBreakdown } = jsonB.data;

    // User B income: 8,000,000 paise, expenses: 0 paise
    assert.equal(summary.totalIncomePaise, 8000000);
    assert.equal(summary.totalExpensePaise, 0);
    assert.equal(categoryBreakdown.length, 0);
  });

  // Test 4: CSV Export report scoped to user and formatted properly
  await suite.test('INSIGHT-04: Export CSV generates authorized, properly escaped transactions file', async () => {
    const res = await fetch(`${baseUrl}/api/v1/insights/export-csv`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });

    assert.equal(res.status, 200);
    assert.ok(res.headers.get('content-type')?.includes('text/csv'));
    assert.ok(res.headers.get('content-disposition')?.includes('attachment; filename="finlearn_transactions_report.csv"'));

    const text = await res.text();
    const lines = text.trim().split('\r\n');
    assert.ok(lines.length >= 4, 'Should include header + 3 Learner A transaction rows');
    assert.equal(lines[0], 'Date,Type,Category,Amount (INR),Amount (Paise),Description,Payment Method');
    assert.ok(text.includes('15000.00'), 'Should convert 1500000 paise to 15000.00 INR');
    assert.ok(!text.includes('80000.00'), 'Learner B freelance income MUST NOT be in Learner A CSV');
  });

  // Test 5: Admin privileged operations automatically record structured audit log entries
  await suite.test('AUDIT-ADM-01: Admin operations record structured audit entries in audit logs', async () => {
    // 1. Create a course as Admin
    const courseRes = await fetch(`${baseUrl}/api/v1/learning/admin/courses`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Audit Test Course: Tax Deductions',
        description: 'Testing audit log creation for curriculum authoring.',
        category: 'Investments',
      }),
    });
    assert.equal(courseRes.status, 201);

    // 2. Query Audit Logs as Admin
    const auditRes = await fetch(`${baseUrl}/api/v1/admin/audit-logs?action=COURSE_CREATED`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(auditRes.status, 200);
    const auditJson = await auditRes.json();
    assert.equal(auditJson.status, 'success');
    assert.ok(auditJson.data.auditLogs.length > 0);

    const log = auditJson.data.auditLogs[0];
    assert.equal(log.action, 'COURSE_CREATED');
    assert.equal(log.targetType, 'Course');
    assert.equal(log.actorRole, 'admin');
    assert.equal(log.outcome, 'success');
    assert.equal(log.details.title, 'Audit Test Course: Tax Deductions');
  });

  // Test 6: Non-admin is denied from audit logs (RBAC 403)
  await suite.test('AUDIT-ADM-02: Ordinary learner denied from accessing system audit logs (RBAC 403)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.equal(res.status, 403);

    const analyticsRes = await fetch(`${baseUrl}/api/v1/admin/analytics`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.equal(analyticsRes.status, 403);
  });

  // Test 7: Audit details sanitization redacts secrets and sensitive keys
  await suite.test('AUDIT-SAN-01: Sensitive credential keys are strictly redacted in audit logs', () => {
    const rawPayload = {
      userEmail: 'user@finlearn.local',
      password: 'SuperSecretPassword123!',
      jwtToken: 'eyJhbGciOi...',
      upiPin: '1234',
      courseTitle: 'Safe Course',
      nested: {
        apiKey: 'AIzaSyD...',
        safeValue: 42,
      },
    };

    const sanitized = sanitizeAuditDetails(rawPayload);
    assert.equal(sanitized.userEmail, 'user@finlearn.local');
    assert.equal(sanitized.password, '[REDACTED]');
    assert.equal(sanitized.jwtToken, '[REDACTED]');
    assert.equal(sanitized.upiPin, '[REDACTED]');
    assert.equal(sanitized.courseTitle, 'Safe Course');
    assert.equal(sanitized.nested.apiKey, '[REDACTED]');
    assert.equal(sanitized.nested.safeValue, 42);
  });

  // Test 8: Admin analytics provides aggregate metrics without leaking private user finances
  await suite.test('AUDIT-PRIV-01: Admin analytics provides aggregate metrics with zero leakage of private user finances', async () => {
    const res = await fetch(`${baseUrl}/api/v1/admin/analytics`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.status, 'success');

    const { analytics } = json.data;
    assert.ok(analytics.totalLearners >= 2, 'Should count learner users');
    assert.ok(analytics.totalCourses >= 1, 'Should count courses');

    // Confirm ZERO private transaction or personal income details in admin analytics response
    const str = JSON.stringify(analytics);
    assert.ok(!str.includes('totalIncomePaise'), 'Admin analytics must not aggregate private user income');
    assert.ok(!str.includes('amountPaise'), 'Admin analytics must not include transaction paise amounts');
    assert.ok(!str.includes('5000000'), 'Must not leak Learner A salary');
    assert.ok(!str.includes('8000000'), 'Must not leak Learner B freelance fee');
  });
});
