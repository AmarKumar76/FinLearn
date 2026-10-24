import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import config from '../src/config/env.js';
import { createApp } from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { GamificationProfile } from '../src/models/gamification.model.js';

test('FinLearn Combined Implementation: Settings, Password Security & Public Profiles', async (suite) => {
  let app;
  let server;
  let baseUrl;

  let userAId;
  let userAToken;
  let userBId;
  let userBToken;

  suite.before(async () => {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(config.mongodbUri, { serverSelectionTimeoutMS: 5000 });
    }
    // Clean up test users collection before running
    await User.deleteMany({ email: { $regex: /@settingsprofiletest\.local$/i } });

    app = createApp();
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });

    // Create User A
    const resA = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Profile Tester Alpha',
        email: 'alpha@settingsprofiletest.local',
        password: 'InitialPassword123!',
      }),
    });
    const dataA = await resA.json();
    userAId = dataA.data.user.id;
    userAToken = dataA.data.token;

    // Create User B
    const resB = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Profile Tester Beta',
        email: 'beta@settingsprofiletest.local',
        password: 'InitialPassword123!',
      }),
    });
    const dataB = await resB.json();
    userBId = dataB.data.user.id;
    userBToken = dataB.data.token;
  });

  suite.after(async () => {
    await User.deleteMany({ email: { $regex: /@settingsprofiletest\.local$/i } });
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  });

  // ==========================================
  // Part A: Account Settings & Identity
  // ==========================================
  await suite.test('SETT-001: Authenticated identity retrieval via /api/v1/users/me/profile', async () => {
    const res = await fetch(`${baseUrl}/api/v1/users/me/profile`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.status, 'success');
    assert.strictEqual(body.data.user.email, 'alpha@settingsprofiletest.local');
    assert.strictEqual(body.data.user.name, 'Profile Tester Alpha');
    assert.ok(body.data.gamification);
  });

  await suite.test('SETT-002: Update profile fields and preferences via /api/v1/users/me/profile', async () => {
    const res = await fetch(`${baseUrl}/api/v1/users/me/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({
        name: 'Alpha Contributor',
        username: 'alphadev',
        bio: 'Senior full-stack financial learner',
        isProfilePublic: true,
        preferences: {
          theme: 'amoled',
          timezone: 'Asia/Kolkata',
          notifications: { inApp: true, email: true },
        },
      }),
    });
    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.data.user.name, 'Alpha Contributor');
    assert.strictEqual(body.data.user.username, 'alphadev');
    assert.strictEqual(body.data.user.bio, 'Senior full-stack financial learner');
    assert.strictEqual(body.data.user.preferences.theme, 'amoled');
  });

  await suite.test('SETT-003: Rejects duplicate username across different users with 409', async () => {
    const res = await fetch(`${baseUrl}/api/v1/users/me/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userBToken}`,
      },
      body: JSON.stringify({
        username: 'alphadev', // already claimed by user A
      }),
    });
    const body = await res.json();
    assert.strictEqual(res.status, 409);
    assert.strictEqual(body.code, 'DUPLICATE_USERNAME');
  });

  // ==========================================
  // Part B: Password Security
  // ==========================================
  await suite.test('SEC-001: Change password fails when current password is incorrect', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({
        currentPassword: 'WrongPassword999!',
        newPassword: 'BrandNewSecurePass123!',
      }),
    });
    const body = await res.json();
    assert.strictEqual(res.status, 401);
    assert.strictEqual(body.code, 'INVALID_CREDENTIALS');
  });

  await suite.test('SEC-002: Change password succeeds with valid current password and rotates token', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({
        currentPassword: 'InitialPassword123!',
        newPassword: 'BrandNewSecurePass123!',
      }),
    });
    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.status, 'success');
    assert.ok(body.data.token, 'Should issue fresh rotated token');

    // Update userAToken to new token
    userAToken = body.data.token;

    // Login with new password should now succeed
    const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'alpha@settingsprofiletest.local',
        password: 'BrandNewSecurePass123!',
      }),
    });
    assert.strictEqual(loginRes.status, 200);
  });

  await suite.test('SEC-003: Forgot password returns safe generic response regardless of existence', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nonexistentuser@example.com',
      }),
    });
    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.status, 'success');
    assert.ok(body.message.includes('If an account exists'));
  });

  await suite.test('SEC-004: Forgot and Reset password flow using expiring single-use crypto token', async () => {
    // Request reset for User B
    const forgotRes = await fetch(`${baseUrl}/api/v1/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'beta@settingsprofiletest.local',
      }),
    });
    const forgotBody = await forgotRes.json();
    assert.strictEqual(forgotRes.status, 200);
    const resetToken = forgotBody.data.resetToken;
    assert.ok(resetToken, 'Non-production environment returns token for testing');

    // Reset password with valid token
    const resetRes = await fetch(`${baseUrl}/api/v1/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: resetToken,
        newPassword: 'BrandNewBetaPassword789!',
      }),
    });
    const resetBody = await resetRes.json();
    assert.strictEqual(resetRes.status, 200);
    assert.strictEqual(resetBody.status, 'success');

    // Token reuse must fail immediately
    const reuseRes = await fetch(`${baseUrl}/api/v1/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: resetToken,
        newPassword: 'AnotherPassword456!',
      }),
    });
    const reuseBody = await reuseRes.json();
    assert.strictEqual(reuseRes.status, 400);
    assert.strictEqual(reuseBody.code, 'TOKEN_EXPIRED_OR_INVALID');

    // User B should now be able to log in with new password and get updated token
    const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'beta@settingsprofiletest.local',
        password: 'BrandNewBetaPassword789!',
      }),
    });
    const loginData = await loginRes.json();
    assert.strictEqual(loginRes.status, 200);
    userBToken = loginData.data.token;
  });

  // ==========================================
  // Part C: Public Profiles & Privacy
  // ==========================================
  await suite.test('PROF-001: View public profile of user with public visibility', async () => {
    const res = await fetch(`${baseUrl}/api/v1/users/profile/alphadev`);
    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.status, 'success');
    assert.strictEqual(body.data.isPrivate, false);
    assert.strictEqual(body.data.user.username, 'alphadev');
    assert.strictEqual(body.data.user.name, 'Alpha Contributor');
    assert.strictEqual(body.data.user.bio, 'Senior full-stack financial learner');
    // Ensure email is NEVER exposed
    assert.strictEqual(body.data.user.email, undefined);
    assert.ok(body.data.gamification);
  });

  await suite.test('PROF-002: Private profile hides personal bio and name for other viewers', async () => {
    // Set user B profile to private and give a username
    await fetch(`${baseUrl}/api/v1/users/me/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userBToken}`,
      },
      body: JSON.stringify({
        username: 'betaprivate',
        isProfilePublic: false,
      }),
    });

    // Anonymous or other user fetches betaprivate
    const res = await fetch(`${baseUrl}/api/v1/users/profile/betaprivate`);
    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.data.isPrivate, true);
    assert.strictEqual(body.data.user.name, 'Private Learner');
    assert.strictEqual(body.data.user.bio, '');
    assert.strictEqual(body.data.user.email, undefined);
    assert.strictEqual(body.data.gamification, null);
  });
});
