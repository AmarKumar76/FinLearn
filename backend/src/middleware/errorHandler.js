import config from '../config/env.js';
import { errorResponse } from '../utils/apiResponse.js';

export function errorHandler(err, req, res, next) {
  const statusCode = err.status || err.statusCode || 500;
  const errorCode = err.code || 'INTERNAL_SERVER_ERROR';

  // Do not leak stack traces in production mode
  const message = config.isProduction && statusCode === 500
    ? 'An unexpected error occurred. Please try again later.'
    : err.message || 'Internal server error';

  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, {
    message: err.message,
    code: errorCode,
    status: statusCode,
    stack: config.isProduction ? undefined : err.stack,
  });

  return errorResponse(res, message, errorCode, statusCode, err.errors || []);
}

export default errorHandler;
