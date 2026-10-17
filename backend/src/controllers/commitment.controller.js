import { Commitment, COMMITMENT_TYPES, RECURRENCE_RULES } from '../models/commitment.model.js';
import { calculateNextRecurrenceDate } from '../utils/recurrence.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

/**
 * List commitments for the authenticated user
 * GET /api/v1/commitments
 */
export async function getCommitments(req, res, next) {
  try {
    const userId = req.user._id;
    const { status, type } = req.query;

    const query = { userId };
    if (status) {
      query.status = status;
    } else {
      query.status = { $ne: 'Archived' };
    }
    if (type && type !== 'all') {
      query.type = type;
    }

    const commitments = await Commitment.find(query).sort({ dueDate: 1 });

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const decorated = commitments.map((c) => {
      const due = new Date(c.dueDate);
      due.setHours(0, 0, 0, 0);

      const isOverdue = c.status !== 'Paid' && due < now;
      const isDueToday = c.status !== 'Paid' && due.getTime() === now.getTime();

      return {
        ...c.toJSON(),
        isOverdue,
        isDueToday,
      };
    });

    return successResponse(res, { commitments: decorated }, 'Commitments retrieved successfully');
  } catch (err) {
    return next(err);
  }
}

/**
 * Create a new commitment
 * POST /api/v1/commitments
 */
export async function createCommitment(req, res, next) {
  try {
    const { title, type, amountPaise, dueDate, recurrence, endDate, notes } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return errorResponse(res, 'Title is required', 'VALIDATION_ERROR', 400);
    }

    if (!COMMITMENT_TYPES.includes(type)) {
      return errorResponse(res, `Invalid commitment type: ${type}`, 'VALIDATION_ERROR', 400);
    }

    const parsedAmount = parseInt(amountPaise, 10);
    if (!Number.isSafeInteger(parsedAmount) || parsedAmount <= 0) {
      return errorResponse(
        res,
        'Amount must be a positive safe integer in paise',
        'VALIDATION_ERROR',
        400
      );
    }

    const parsedDueDate = new Date(dueDate);
    if (isNaN(parsedDueDate.getTime())) {
      return errorResponse(res, 'Invalid due date', 'VALIDATION_ERROR', 400);
    }

    if (recurrence && !RECURRENCE_RULES.includes(recurrence)) {
      return errorResponse(res, `Invalid recurrence rule: ${recurrence}`, 'VALIDATION_ERROR', 400);
    }

    let parsedEndDate = null;
    if (endDate) {
      parsedEndDate = new Date(endDate);
      if (isNaN(parsedEndDate.getTime())) {
        return errorResponse(res, 'Invalid end date', 'VALIDATION_ERROR', 400);
      }
      if (parsedEndDate < parsedDueDate) {
        return errorResponse(res, 'End date cannot be prior to due date', 'VALIDATION_ERROR', 400);
      }
    }

    const commitment = new Commitment({
      userId: req.user._id,
      title: title.trim(),
      type,
      amountPaise: parsedAmount,
      dueDate: parsedDueDate,
      recurrence: recurrence || 'Monthly',
      endDate: parsedEndDate,
      status: 'Scheduled',
      notes: typeof notes === 'string' ? notes.trim() : '',
      paymentHistory: [],
    });

    await commitment.save();

    return successResponse(res, { commitment: commitment.toJSON() }, 'Commitment created', 201);
  } catch (err) {
    return next(err);
  }
}

/**
 * Record a manual payment with idempotency key protection
 * POST /api/v1/commitments/:id/payments
 */
export async function recordPayment(req, res, next) {
  try {
    const { id } = req.params;
    const { amountPaise, paidDate, notes, idempotencyKey } = req.body;

    const commitment = await Commitment.findOne({ _id: id, userId: req.user._id });
    if (!commitment) {
      return errorResponse(res, 'Commitment not found or access denied', 'NOT_FOUND', 404);
    }

    // Idempotency check: if an idempotency key was supplied and matches an existing record, return that record
    if (idempotencyKey) {
      const existingPayment = commitment.paymentHistory.find(
        (p) => p.idempotencyKey === idempotencyKey
      );
      if (existingPayment) {
        return successResponse(
          res,
          {
            commitment: commitment.toJSON(),
            payment: existingPayment,
            duplicateIgnored: true,
          },
          'Payment already recorded (idempotent request recognized)'
        );
      }
    }

    const payAmount = amountPaise !== undefined ? parseInt(amountPaise, 10) : commitment.amountPaise;
    if (!Number.isSafeInteger(payAmount) || payAmount <= 0) {
      return errorResponse(res, 'Valid payment amount in paise required', 'VALIDATION_ERROR', 400);
    }

    const parsedPaidDate = paidDate ? new Date(paidDate) : new Date();

    const paymentRecord = {
      amountPaise: payAmount,
      paidDate: parsedPaidDate,
      idempotencyKey: idempotencyKey || undefined,
      notes: typeof notes === 'string' ? notes.trim() : '',
      isUserReported: true,
    };

    commitment.paymentHistory.push(paymentRecord);

    // If recurring, advance dueDate to next cycle; if One-time, mark status 'Paid'
    if (commitment.recurrence === 'One-time') {
      commitment.status = 'Paid';
    } else {
      const nextDue = calculateNextRecurrenceDate(commitment.dueDate, commitment.recurrence);
      if (nextDue) {
        // If an endDate exists and nextDue exceeds it, mark as Paid/Completed
        if (commitment.endDate && nextDue > commitment.endDate) {
          commitment.status = 'Paid';
        } else {
          commitment.dueDate = nextDue;
          commitment.status = 'Scheduled';
        }
      } else {
        commitment.status = 'Paid';
      }
    }

    await commitment.save();

    return successResponse(
      res,
      {
        commitment: commitment.toJSON(),
        payment: paymentRecord,
        disclaimer: 'Payment marked as user-reported. External bank verification is not performed.',
      },
      'Payment recorded successfully'
    );
  } catch (err) {
    return next(err);
  }
}

/**
 * Archive a commitment while preserving historical payment records
 * PATCH /api/v1/commitments/:id/archive
 */
export async function archiveCommitment(req, res, next) {
  try {
    const { id } = req.params;
    const commitment = await Commitment.findOne({ _id: id, userId: req.user._id });
    if (!commitment) {
      return errorResponse(res, 'Commitment not found or access denied', 'NOT_FOUND', 404);
    }

    commitment.status = 'Archived';
    await commitment.save();

    return successResponse(res, { commitment: commitment.toJSON() }, 'Commitment archived');
  } catch (err) {
    return next(err);
  }
}

export default {
  getCommitments,
  createCommitment,
  recordPayment,
  archiveCommitment,
};
