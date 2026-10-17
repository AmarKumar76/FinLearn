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
import { generateToken } from '../src/utils/token.js';
import { calculateNextRecurrenceDate } from '../src/utils/recurrence.js';

test('FinLearn Phase 4 Money Command Center & Data Integrity Suite', async (suite) => {
  let app;
  let server;
  let baseUrl;

  let userA;
  let userB;
  let tokenA;
  let tokenB;

  suite.before(async () => {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(config.mongodbUri, { serverSelectionTimeoutMS: 5000 });
    }

    // Clean up test data
    await Promise.all([
      User.deleteMany({ email: { $regex: /@moneytest\.local$/i } }),
      Transaction.deleteMany({}),
      Budget.deleteMany({}),
      SavingsGoal.deleteMany({}),
      Commitment.deleteMany({}),
    ]);

    // Create User A
    userA = new User({
      name: 'User A',
      email: 'usera@moneytest.local',
      passwordHash: 'ValidPassword123!',
      role: 'user',
    });
    await userA.save();
    tokenA = generateToken(userA);

    // Create User B
    userB = new User({
      name: 'User B',
      email: 'userb@moneytest.local',
      passwordHash: 'ValidPassword123!',
      role: 'user',
    });
    await userB.save();
    tokenB = generateToken(userB);

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
      User.deleteMany({ email: { $regex: /@moneytest\.local$/i } }),
      Transaction.deleteMany({}),
      Budget.deleteMany({}),
      SavingsGoal.deleteMany({}),
      Commitment.deleteMany({}),
    ]);
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  });

  // ==========================================
  // 1. TRANSACTION CRUD, INTEGER PAISE & VALIDATION
  // ==========================================
  let txnIdA;

  await suite.test('TXN-001: Create income and expense with integer paise amount', async () => {
    // Create Income for User A: ₹50,000.00 = 5,000,000 paise
    const resIncome = await fetch(`${baseUrl}/api/v1/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        title: 'Monthly Salary',
        type: 'income',
        category: 'Salary & Wages',
        amountPaise: 5000000,
        date: '2026-10-01',
        description: 'October Tech Salary',
      }),
    });

    const bodyIncome = await resIncome.json();
    assert.strictEqual(resIncome.status, 201);
    assert.strictEqual(bodyIncome.data.transaction.amountPaise, 5000000);
    assert.strictEqual(bodyIncome.data.transaction.userId, userA._id.toString());

    // Create Expense for User A: ₹4,500.50 = 450,050 paise
    const resExpense = await fetch(`${baseUrl}/api/v1/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        title: 'Supermarket Grocery Run',
        type: 'expense',
        category: 'Food & Groceries',
        amountPaise: 450050,
        date: '2026-10-05',
        description: 'Weekly organic groceries',
      }),
    });

    const bodyExpense = await resExpense.json();
    assert.strictEqual(resExpense.status, 201);
    assert.strictEqual(bodyExpense.data.transaction.amountPaise, 450050);
    txnIdA = bodyExpense.data.transaction.id;
    assert.ok(txnIdA);
  });

  await suite.test('TXN-002: Rejection of negative, zero, or non-integer paise amount', async () => {
    const invalidAmounts = [-100, 0, 45.5, 'invalid', null];

    for (const invalidAmount of invalidAmounts) {
      const res = await fetch(`${baseUrl}/api/v1/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({
          title: 'Invalid Amount Entry',
          type: 'expense',
          category: 'Food & Groceries',
          amountPaise: invalidAmount,
        }),
      });

      assert.strictEqual(res.status, 400, `Should reject invalid amount: ${invalidAmount}`);
    }
  });

  await suite.test('TXN-010: BOLA/IDOR prevention — User B cannot read, update, or delete User A transaction', async () => {
    // 1. User B attempts to read User A's transaction
    const getRes = await fetch(`${baseUrl}/api/v1/transactions/${txnIdA}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.strictEqual(getRes.status, 404, 'Must return 404/denial for unauthorized user');

    // 2. User B attempts to update User A's transaction
    const updateRes = await fetch(`${baseUrl}/api/v1/transactions/${txnIdA}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({ title: 'Tampered by User B' }),
    });
    assert.strictEqual(updateRes.status, 404);

    // 3. User B attempts to delete User A's transaction
    const deleteRes = await fetch(`${baseUrl}/api/v1/transactions/${txnIdA}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.strictEqual(deleteRes.status, 404);
  });

  // ==========================================
  // 2. BUDGETS & RECONCILIATION
  // ==========================================
  await suite.test('BUD-001 & BUD-005: Create budget and prevent duplicate for same category/period', async () => {
    // Create Food budget for October 2026: ₹10,000 = 1,000,000 paise
    const res = await fetch(`${baseUrl}/api/v1/budgets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        category: 'Food & Groceries',
        period: 'October 2026',
        limitPaise: 1000000,
        startDate: '2026-10-01',
        endDate: '2026-10-31',
        thresholdPct: 80,
      }),
    });

    const body = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(body.data.budget.category, 'Food & Groceries');

    // Attempt to create duplicate budget in same period
    const dupRes = await fetch(`${baseUrl}/api/v1/budgets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        category: 'Food & Groceries',
        period: 'October 2026',
        limitPaise: 2000000,
        startDate: '2026-10-01',
        endDate: '2026-10-31',
      }),
    });
    assert.strictEqual(dupRes.status, 409);
  });

  await suite.test('BUD-004 & TXN-011: Budget dynamically reconciles spentPaise from user transactions', async () => {
    // Previously created Food & Groceries expense was 450,050 paise
    const res = await fetch(`${baseUrl}/api/v1/budgets?period=October 2026`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const body = await res.json();
    assert.strictEqual(res.status, 200);

    const foodBudget = body.data.budgets.find((b) => b.category === 'Food & Groceries');
    assert.ok(foodBudget);
    assert.strictEqual(foodBudget.limitPaise, 1000000);
    assert.strictEqual(foodBudget.spentPaise, 450050);
    assert.strictEqual(foodBudget.remainingPaise, 549950);
    assert.strictEqual(foodBudget.utilizationPct, 45); // 450,050 / 1,000,000 = 45%
  });

  // ==========================================
  // 3. SAVINGS GOALS & WITHDRAWAL PROTECTION
  // ==========================================
  let goalId;

  await suite.test('SAV-001 & SAV-002: Create savings goal and add contributions', async () => {
    const res = await fetch(`${baseUrl}/api/v1/savings-goals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        name: 'Emergency Fund',
        targetPaise: 10000000, // ₹1,00,000
        targetDate: '2027-12-31',
        initialDepositPaise: 2000000, // ₹20,000 initial deposit
      }),
    });

    const body = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(body.data.goal.savedPaise, 2000000);
    goalId = body.data.goal.id;

    // Add additional deposit of ₹10,000 (1,000,000 paise)
    const depositRes = await fetch(`${baseUrl}/api/v1/savings-goals/${goalId}/contributions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        type: 'deposit',
        amountPaise: 1000000,
        note: 'Monthly allocation',
      }),
    });

    const depositBody = await depositRes.json();
    assert.strictEqual(depositRes.status, 200);
    assert.strictEqual(depositBody.data.savedPaise, 3000000);
  });

  await suite.test('SAV-003: Rejection of withdrawal exceeding saved balance (overdraft protection)', async () => {
    // Current saved is 3,000,000 paise. Attempting to withdraw 4,000,000 paise must fail.
    const res = await fetch(`${baseUrl}/api/v1/savings-goals/${goalId}/contributions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        type: 'withdrawal',
        amountPaise: 4000000,
        note: 'Overdraft attempt',
      }),
    });

    const body = await res.json();
    assert.strictEqual(res.status, 400);
    assert.strictEqual(body.code, 'INSUFFICIENT_FUNDS');
  });

  // ==========================================
  // 4. COMMITMENTS, RECURRENCE & IDEMPOTENT PAYMENTS
  // ==========================================
  let commitmentId;

  await suite.test('COM-002: Recurrence calculation clamps month-end (Jan 31 -> Feb 28 in non-leap year)', () => {
    const nextDate = calculateNextRecurrenceDate('2025-01-31', 'Monthly');
    assert.strictEqual(nextDate.getFullYear(), 2025);
    assert.strictEqual(nextDate.getMonth(), 1); // February (0-indexed 1)
    assert.strictEqual(nextDate.getDate(), 28, 'Must clamp 31 to 28 for non-leap Feb');

    // Leap year test (2024 is leap year)
    const nextLeapDate = calculateNextRecurrenceDate('2024-01-31', 'Monthly');
    assert.strictEqual(nextLeapDate.getDate(), 29, 'Must clamp 31 to 29 for leap year Feb');
  });

  await suite.test('COM-001 & COM-005: Create commitment and record payment with idempotency protection', async () => {
    const res = await fetch(`${baseUrl}/api/v1/commitments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        title: 'Home WiFi Broadband',
        type: 'Utility Bill',
        amountPaise: 99900, // ₹999.00
        dueDate: '2026-10-15',
        recurrence: 'Monthly',
      }),
    });

    const body = await res.json();
    assert.strictEqual(res.status, 201);
    commitmentId = body.data.commitment.id;

    // Record payment with Idempotency Key
    const payRes1 = await fetch(`${baseUrl}/api/v1/commitments/${commitmentId}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        amountPaise: 99900,
        idempotencyKey: 'idem_key_oct_wifi_123',
        notes: 'Paid via netbanking',
      }),
    });

    const payBody1 = await payRes1.json();
    assert.strictEqual(payRes1.status, 200);
    assert.ok(payBody1.data.disclaimer.includes('user-reported'));

    // Duplicate submission with SAME idempotency key must not double-charge or create another payment record
    const payRes2 = await fetch(`${baseUrl}/api/v1/commitments/${commitmentId}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        amountPaise: 99900,
        idempotencyKey: 'idem_key_oct_wifi_123',
      }),
    });

    const payBody2 = await payRes2.json();
    assert.strictEqual(payRes2.status, 200);
    assert.strictEqual(payBody2.data.duplicateIgnored, true);
  });

  // ==========================================
  // 5. DASHBOARD RECONCILIATION
  // ==========================================
  await suite.test('DASH-009: Dashboard summary reconciles strictly with stored user records', async () => {
    const res = await fetch(`${baseUrl}/api/v1/dashboard/summary?startDate=2026-10-01&endDate=2026-10-31`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });

    const body = await res.json();
    assert.strictEqual(res.status, 200);
    const { financials, budgets, savingsSummary, commitments } = body.data;

    // Income: 5,000,000 paise (₹50,000)
    assert.strictEqual(financials.totalIncomePaise, 5000000);
    // Expense: 450,050 paise (₹4,500.50)
    assert.strictEqual(financials.totalExpensePaise, 450050);
    // Net Cash Flow: 5,000,000 - 450,050 = 4,549,950 paise
    assert.strictEqual(financials.netCashFlowPaise, 4549950);

    // Budget utilization
    const food = budgets.find((b) => b.category === 'Food & Groceries');
    assert.ok(food);
    assert.strictEqual(food.spentPaise, 450050);

    // Savings summary
    assert.strictEqual(savingsSummary.totalSavedPaise, 3000000);
  });

  await suite.test('DASH-001: New User B receives authentic zero/empty state with zero hallucinated figures', async () => {
    const res = await fetch(`${baseUrl}/api/v1/dashboard/summary`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });

    const body = await res.json();
    assert.strictEqual(res.status, 200);
    const { financials, budgets, savingsGoals, commitments, recentTransactions } = body.data;

    assert.strictEqual(financials.totalIncomePaise, 0);
    assert.strictEqual(financials.totalExpensePaise, 0);
    assert.strictEqual(financials.netCashFlowPaise, 0);
    assert.strictEqual(budgets.length, 0);
    assert.strictEqual(savingsGoals.length, 0);
    assert.strictEqual(commitments.upcoming.length, 0);
    assert.strictEqual(commitments.overdue.length, 0);
    assert.strictEqual(recentTransactions.length, 0);
  });
});
