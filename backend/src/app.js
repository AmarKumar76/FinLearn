import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import config from './config/env.js';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import transactionRoutes from './routes/transaction.routes.js';
import budgetRoutes from './routes/budget.routes.js';
import savingsGoalRoutes from './routes/savingsGoal.routes.js';
import commitmentRoutes from './routes/commitment.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import learningRoutes from './routes/learning.routes.js';
import quizRoutes from './routes/quiz.routes.js';
import guidanceRoutes from './routes/guidance.routes.js';
import aiCoachRoutes from './routes/aiCoach.routes.js';
import insightsRoutes from './routes/insights.routes.js';
import adminAuditRoutes from './routes/adminAudit.routes.js';
import { notFoundHandler } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  // Trust first proxy (Render / Cloudflare) so Express rate-limit and req.ip accurately read client IP
  app.set('trust proxy', 1);

  // Security Headers
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  // CORS Configuration
  const configuredOrigins = (config.frontendUrl || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const allowedOrigins = Array.from(
    new Set([
      ...configuredOrigins,
      'https://fin-learn-omega.vercel.app',
      'http://localhost:5173',
      'http://localhost:5174',
    ])
  );

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server) or matching frontend
      if (!origin || allowedOrigins.includes(origin) || config.frontendUrl === '*') {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
  }));

  // Body Parsing with safe limit to prevent memory exhaustion DoS
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Cookie Parser for HttpOnly session cookies
  app.use(cookieParser());

  // General Rate Limiting
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // limit each IP to 200 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      status: 'error',
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again after 15 minutes',
    },
  });
  app.use('/api/', generalLimiter);

  // Mount API v1 Routes
  app.use('/api/v1/health', healthRoutes);
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/transactions', transactionRoutes);
  app.use('/api/v1/budgets', budgetRoutes);
  app.use('/api/v1/savings-goals', savingsGoalRoutes);
  app.use('/api/v1/commitments', commitmentRoutes);
  app.use('/api/v1/dashboard', dashboardRoutes);
  app.use('/api/v1/learning', learningRoutes);
  app.use('/api/v1/assessment', quizRoutes);
  app.use('/api/v1/guidance', guidanceRoutes);
  app.use('/api/v1/ai-coach', aiCoachRoutes);
  app.use('/api/v1/insights', insightsRoutes);
  app.use('/api/v1/admin', adminAuditRoutes);

  // 404 Handler
  app.use(notFoundHandler);

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}

export default createApp;
