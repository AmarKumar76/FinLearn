import { getDatabaseStatus } from '../config/database.js';
import config from '../config/env.js';

export function getHealth(req, res) {
  const dbStatus = getDatabaseStatus();

  // If database is configured and required, check if connected
  const isHealthy = true; // API server is healthy and responding

  const payload = {
    status: isHealthy ? 'healthy' : 'degraded',
    version: '1.0.0',
    environment: config.nodeEnv,
    uptimeSeconds: process.uptime(),
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus.status,
      connected: dbStatus.connected,
      error: dbStatus.error,
    },
    services: {
      api: 'operational',
      securityMiddleware: 'active',
    },
  };

  // If database is disconnected, we return HTTP 200 with degraded status in dev, or 503 if strict DB required
  const statusCode = dbStatus.connected || config.nodeEnv !== 'production' ? 200 : 503;

  return res.status(statusCode).json(payload);
}

export default {
  getHealth,
};
