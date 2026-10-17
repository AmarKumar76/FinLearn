import { errorResponse } from '../utils/apiResponse.js';

export function notFoundHandler(req, res) {
  return errorResponse(
    res,
    `Route ${req.method} ${req.originalUrl} not found`,
    'NOT_FOUND',
    404
  );
}

export default notFoundHandler;
