import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';

test('Backend Health & App Setup Tests', async (t) => {
  const app = createApp();

  await t.test('createApp initializes express application instance', () => {
    assert.ok(app);
    assert.strictEqual(typeof app.listen, 'function');
  });

  await t.test('notFoundHandler returns structured 404 for unknown route', async () => {
    // Test custom request simulation
    const req = { method: 'GET', originalUrl: '/api/v1/unknown-test-path' };
    let statusSent = null;
    let jsonSent = null;

    const res = {
      status(code) {
        statusSent = code;
        return this;
      },
      json(payload) {
        jsonSent = payload;
        return this;
      },
    };

    const notFound = (await import('../src/middleware/notFound.js')).notFoundHandler;
    notFound(req, res);

    assert.strictEqual(statusSent, 404);
    assert.strictEqual(jsonSent.status, 'error');
    assert.strictEqual(jsonSent.code, 'NOT_FOUND');
    assert.ok(jsonSent.message.includes('/api/v1/unknown-test-path'));
  });

  await t.test('Health controller produces valid JSON health status schema', async () => {
    const req = {};
    let statusSent = null;
    let jsonSent = null;

    const res = {
      status(code) {
        statusSent = code;
        return this;
      },
      json(payload) {
        jsonSent = payload;
        return this;
      },
    };

    const { getHealth } = await import('../src/controllers/health.controller.js');
    getHealth(req, res);

    assert.ok([200, 503].includes(statusSent));
    assert.ok(jsonSent);
    assert.ok(jsonSent.status === 'healthy' || jsonSent.status === 'degraded');
    assert.ok(jsonSent.database);
    assert.ok(typeof jsonSent.uptimeSeconds === 'number');
    assert.strictEqual(jsonSent.services.api, 'operational');
  });
});
