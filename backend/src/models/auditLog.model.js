import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    actorEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    actorRole: {
      type: String,
      required: true,
      enum: ['admin', 'user', 'system'],
      default: 'admin',
    },
    action: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    targetType: {
      type: String,
      required: true,
      enum: ['Course', 'Lesson', 'Quiz', 'Material', 'Source', 'User', 'System', 'Report'],
      index: true,
    },
    targetId: {
      type: String,
      default: null,
      trim: true,
    },
    outcome: {
      type: String,
      enum: ['success', 'failure'],
      default: 'success',
      index: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound index for fast timeline queries
auditLogSchema.index({ createdAt: -1, action: 1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
