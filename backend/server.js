import { createApp } from './src/app.js';
import config, { validateEnv } from './src/config/env.js';
import { connectDatabase } from './src/config/database.js';

async function bootstrap() {
  try {
    // 1. Validate environment configuration
    validateEnv();

    // 2. Initialize database connection
    await connectDatabase();

    // 3. Create Express application
    const app = createApp();

    // 4. Start HTTP Server
    const server = app.listen(config.port, () => {
      console.log(`[SERVER] FinLearn API running in ${config.nodeEnv} mode on port ${config.port}`);
      console.log(`[SERVER] Health endpoint available at http://localhost:${config.port}/api/v1/health`);
    });

    // Graceful Shutdown
    const handleShutdown = (signal) => {
      console.log(`\n[SERVER] Received ${signal}. Gracefully shutting down...`);
      server.close(() => {
        console.log('[SERVER] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));

    return server;
  } catch (err) {
    console.error('[FATAL BOOTSTRAP ERROR]:', err.message);
    process.exit(1);
  }
}

bootstrap();
