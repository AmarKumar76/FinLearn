import { errorResponse } from '../utils/apiResponse.js';

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function validateRegister(req, res, next) {
  const { name, email, password, role } = req.body;
  const errors = [];

  // Prevent client privilege escalation: registering as admin is strictly blocked
  if (role && role !== 'user') {
    return errorResponse(
      res,
      'Registration cannot assign privileged roles. Role assignment is prohibited.',
      'PRIVILEGE_ESCALATION_BLOCKED',
      403
    );
  }

  // Name validation
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Name is required' });
  } else if (name.trim().length < 2) {
    errors.push({ field: 'name', message: 'Name must be at least 2 characters long' });
  } else if (name.length > 100) {
    errors.push({ field: 'name', message: 'Name cannot exceed 100 characters' });
  }

  // Email validation
  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!EMAIL_REGEX.test(email.trim())) {
    errors.push({ field: 'email', message: 'Invalid email format' });
  } else if (email.length > 254) {
    errors.push({ field: 'email', message: 'Email cannot exceed 254 characters' });
  }

  // Password validation
  if (!password || typeof password !== 'string') {
    errors.push({ field: 'password', message: 'Password is required' });
  } else {
    if (password.length < 8) {
      errors.push({ field: 'password', message: 'Password must be at least 8 characters long' });
    }
    if (password.length > 128) {
      errors.push({ field: 'password', message: 'Password cannot exceed 128 characters' });
    }
    if (!/[A-Z]/.test(password)) {
      errors.push({ field: 'password', message: 'Password must contain at least one uppercase letter' });
    }
    if (!/[a-z]/.test(password)) {
      errors.push({ field: 'password', message: 'Password must contain at least one lowercase letter' });
    }
    if (!/[0-9]/.test(password)) {
      errors.push({ field: 'password', message: 'Password must contain at least one digit' });
    }
  }

  if (errors.length > 0) {
    return errorResponse(res, 'Validation failed', 'VALIDATION_ERROR', 400, errors);
  }

  // Normalize inputs
  req.body.name = name.trim();
  req.body.email = email.trim().toLowerCase();

  next();
}

export function validateLogin(req, res, next) {
  const { email, password } = req.body;
  const errors = [];

  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    errors.push({ field: 'email', message: 'Email is required' });
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    errors.push({ field: 'password', message: 'Password is required' });
  }

  if (errors.length > 0) {
    return errorResponse(res, 'Validation failed', 'VALIDATION_ERROR', 400, errors);
  }

  // Normalize email
  req.body.email = email.trim().toLowerCase();

  next();
}

export default {
  validateRegister,
  validateLogin,
};
