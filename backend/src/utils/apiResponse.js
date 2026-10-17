/**
 * Centralized API response utilities ensuring consistent JSON envelope structure
 */

export function successResponse(res, data = {}, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    status: 'success',
    message,
    data,
    timestamp: new Date().toISOString(),
  });
}

export function errorResponse(res, message = 'Internal error', code = 'SERVER_ERROR', statusCode = 500, errors = []) {
  const payload = {
    status: 'error',
    code,
    message,
    timestamp: new Date().toISOString(),
  };

  if (errors && errors.length > 0) {
    payload.errors = errors;
  }

  return res.status(statusCode).json(payload);
}
