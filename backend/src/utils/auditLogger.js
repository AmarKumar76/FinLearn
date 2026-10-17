import { AuditLog } from '../models/auditLog.model.js';

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'token',
  'refreshtoken',
  'jwt',
  'secret',
  'key',
  'apikey',
  'pin',
  'upipin',
  'otp',
  'cvv',
  'accountnumber',
]);

function isSensitiveKey(key) {
  const lowerKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (SENSITIVE_KEYS.has(lowerKey)) return true;
  if (
    lowerKey.includes('password') ||
    lowerKey.includes('token') ||
    lowerKey.includes('secret') ||
    lowerKey.includes('apikey') ||
    lowerKey.includes('pin') ||
    lowerKey.includes('otp') ||
    lowerKey.includes('cvv') ||
    lowerKey.includes('jwt')
  ) {
    return true;
  }
  return false;
}

/**
 * Recursively sanitizes any sensitive credentials from details payload
 */
export function sanitizeAuditDetails(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeAuditDetails(item));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (isSensitiveKey(key)) {
      sanitized[key] = '[REDACTED]';
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeAuditDetails(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Asynchronously record an audit event without blocking execution
 */
export async function logAuditEvent({
  actor,
  action,
  targetType,
  targetId = null,
  details = {},
  outcome = 'success',
  ipAddress = '127.0.0.1',
}) {
  try {
    if (!actor || !actor._id || !action || !targetType) {
      return null;
    }

    const sanitizedDetails = sanitizeAuditDetails(details);

    const logEntry = new AuditLog({
      actorId: actor._id,
      actorEmail: actor.email || 'unknown@finlearn.local',
      actorRole: actor.role || 'user',
      action,
      targetType,
      targetId: targetId ? targetId.toString() : null,
      outcome,
      details: sanitizedDetails,
      ipAddress,
    });

    await logEntry.save();
    return logEntry;
  } catch (err) {
    // Audit log failures must never crash primary application threads
    console.warn('[AUDIT LOG ERROR] Failed to record audit log:', err.message);
    return null;
  }
}

export default {
  sanitizeAuditDetails,
  logAuditEvent,
};
