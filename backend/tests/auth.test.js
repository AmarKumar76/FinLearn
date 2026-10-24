import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import config from '../src/config/env.js';
import { createApp } from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { generateToken, verifyToken } from '../src/utils/token.js';

test('FinLearn Phase 3 Authentication, RBAC & Security Test Suite', async (suite) => {
  let app;
  let server;
  let baseUrl;

  suite.before(async () => {
    // Connect to test database
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(config.mongodbUri, { serverSelectionTimeoutMS: 5000 });
    }
    // Clean up test users collection before running
    await User.deleteMany({ email: { $regex: /@finlearntest\.local$/i } });

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
    // Clean up test users
    await User.deleteMany({ email: { $regex: /@finlearntest\.local$/i } });
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  });

  // ==========================================
  // 1. REGISTRATION TESTS
  // ==========================================
  await suite.test('AUTH-001: Successful user registration', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Arjun Sharma',
        email: 'arjun@finlearntest.local',
        password: 'ValidPassword123!',
      }),
    });

    const body = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(body.status, 'success');
    assert.strictEqual(body.data.user.email, 'arjun@finlearntest.local');
    assert.strictEqual(body.data.user.role, 'user');
    assert.strictEqual(body.data.user.accountStatus, 'active');
    assert.strictEqual(body.data.user.passwordHash, undefined, 'Password hash must never be returned');
    assert.ok(body.data.token, 'Token must be issued upon registration');

    // Cookie header check
    const setCookie = res.headers.get('set-cookie');
    assert.ok(setCookie, 'HttpOnly auth cookie must be set');
    assert.ok(setCookie.includes('finlearn_auth_token='), 'Cookie name must match');
    assert.ok(setCookie.toLowerCase().includes('httponly'), 'Cookie must be HttpOnly');
  });

  await suite.test('AUTH-001b: Successful user registration via /signup alias', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Pooja Verma',
        email: 'pooja@finlearntest.local',
        password: 'ValidPassword123!',
      }),
    });

    const body = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(body.status, 'success');
    assert.strictEqual(body.data.user.email, 'pooja@finlearntest.local');
  });

  await suite.test('AUTH-002: Rejection of duplicate email (case-insensitive normalization)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Arjun Clone',
        email: 'ARJUN@finlearntest.local', // Different casing
        password: 'ValidPassword123!',
      }),
    });

    const body = await res.json();
    assert.strictEqual(res.status, 409);
    assert.strictEqual(body.code, 'DUPLICATE_EMAIL');
  });

  await suite.test('AUTH-003: Rejection of invalid email format', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Invalid Email User',
        email: 'not-an-email',
        password: 'ValidPassword123!',
      }),
    });

    const body = await res.json();
    assert.strictEqual(res.status, 400);
    assert.strictEqual(body.code, 'VALIDATION_ERROR');
    assert.ok(body.errors.some((e) => e.field === 'email'));
  });

  await suite.test('AUTH-004: Rejection of weak passwords', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Weak Pass User',
        email: 'weakpass@finlearntest.local',
        password: 'weak',
      }),
    });

    const body = await res.json();
    assert.strictEqual(res.status, 400);
    assert.strictEqual(body.code, 'VALIDATION_ERROR');
    assert.ok(body.errors.some((e) => e.field === 'password'));
  });

  await suite.test('AUTH-016: Public registration privilege escalation prevention (role tampering)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Malicious Attacker',
        email: 'hacker@finlearntest.local',
        password: 'ValidPassword123!',
        role: 'admin', // Attempting to escalate role
      }),
    });

    const body = await res.json();
    assert.strictEqual(res.status, 403);
    assert.strictEqual(body.code, 'PRIVILEGE_ESCALATION_BLOCKED');
  });

  // ==========================================
  // 2. LOGIN TESTS
  // ==========================================
  await suite.test('AUTH-005: Successful login with correct credentials', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'arjun@finlearntest.local',
        password: 'ValidPassword123!',
      }),
    });

    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.status, 'success');
    assert.strictEqual(body.data.user.email, 'arjun@finlearntest.local');
    assert.strictEqual(body.data.user.passwordHash, undefined);
    assert.ok(body.data.token);
  });

  await suite.test('AUTH-006: Rejection of login with incorrect password', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'arjun@finlearntest.local',
        password: 'WrongPassword999!',
      }),
    });

    const body = await res.json();
    assert.strictEqual(res.status, 401);
    assert.strictEqual(body.code, 'INVALID_CREDENTIALS');
  });

  await suite.test('AUTH-007: Rejection of login for non-existent user', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nonexistent@finlearntest.local',
        password: 'ValidPassword123!',
      }),
    });

    const body = await res.json();
    assert.strictEqual(res.status, 401);
    assert.strictEqual(body.code, 'INVALID_CREDENTIALS');
  });

  // ==========================================
  // 3. PROTECTED /auth/me & RBAC TESTS
  // ==========================================
  let authToken;
  let authCookie;

  await suite.test('Setup: Obtain valid token and cookie for protected tests', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'arjun@finlearntest.local',
        password: 'ValidPassword123!',
      }),
    });
    const body = await res.json();
    authToken = body.data.token;
    authCookie = res.headers.get('set-cookie');
    assert.ok(authToken);
  });

  await suite.test('AUTH-008: GET /api/v1/auth/me succeeds with Bearer token', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.status, 'success');
    assert.strictEqual(body.data.user.email, 'arjun@finlearntest.local');
  });

  await suite.test('AUTH-009: GET /api/v1/auth/me succeeds with HttpOnly cookie', async () => {
    const cookieHeader = authCookie.split(';')[0];
    const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: {
        Cookie: cookieHeader,
      },
    });

    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.status, 'success');
    assert.strictEqual(body.data.user.email, 'arjun@finlearntest.local');
  });

  await suite.test('AUTH-010: Rejection of unauthenticated request to protected endpoint', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/me`);
    const body = await res.json();
    assert.strictEqual(res.status, 401);
    assert.strictEqual(body.code, 'UNAUTHORIZED');
  });

  await suite.test('AUTH-011: Rejection of malformed Bearer token', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: {
        Authorization: 'Bearer invalid.token.payload',
      },
    });
    const body = await res.json();
    assert.strictEqual(res.status, 401);
    assert.strictEqual(body.code, 'MALFORMED_TOKEN');
  });

  await suite.test('ADMIN-001: Ordinary user denied from admin-only route (RBAC 403)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/admin-only`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    const body = await res.json();
    assert.strictEqual(res.status, 403);
    assert.strictEqual(body.code, 'FORBIDDEN');
  });

  await suite.test('ADMIN-002: Admin user successfully accesses admin-only route', async () => {
    // Create an admin user directly in the database
    const adminUser = new User({
      name: 'System Admin',
      email: 'admin@finlearntest.local',
      passwordHash: 'ValidPassword123!',
      role: 'admin',
      accountStatus: 'active',
    });
    await adminUser.save();

    const adminToken = generateToken(adminUser);

    const res = await fetch(`${baseUrl}/api/v1/auth/admin-only`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.status, 'success');
    assert.strictEqual(body.data.adminAccessGranted, true);
    assert.strictEqual(body.data.user.role, 'admin');
  });

  await suite.test('AUTH-012: Disabled user is blocked from protected routes', async () => {
    // Disable user Arjun
    await User.updateOne({ email: 'arjun@finlearntest.local' }, { accountStatus: 'disabled' });

    const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    const body = await res.json();
    assert.strictEqual(res.status, 403);
    assert.strictEqual(body.code, 'ACCOUNT_DISABLED');

    // Restore user
    await User.updateOne({ email: 'arjun@finlearntest.local' }, { accountStatus: 'active' });
  });

  // ==========================================
  // 4. LOGOUT & REVOCATION TESTS
  // ==========================================
  await suite.test('AUTH-013: Logout invalidates token via tokenVersion increment', async () => {
    // Login to get fresh token
    const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'arjun@finlearntest.local',
        password: 'ValidPassword123!',
      }),
    });
    const { data: { token: preLogoutToken } } = await loginRes.json();

    // Call logout endpoint
    const logoutRes = await fetch(`${baseUrl}/api/v1/auth/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${preLogoutToken}`,
      },
    });
    assert.strictEqual(logoutRes.status, 200);

    // Attempting to reuse preLogoutToken must fail with SESSION_REVOKED
    const reuseRes = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: {
        Authorization: `Bearer ${preLogoutToken}`,
      },
    });
    const reuseBody = await reuseRes.json();
    assert.strictEqual(reuseRes.status, 401);
    assert.strictEqual(reuseBody.code, 'SESSION_REVOKED');
  });
});
