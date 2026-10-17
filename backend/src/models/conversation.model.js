import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      enum: ['user', 'coach'],
      required: true,
    },
    text: {
      type: String,
      required: true,
      maxlength: [4000, 'Message text cannot exceed 4000 characters'],
    },
    sources: [
      {
        title: { type: String, required: true },
        url: { type: String, default: '' },
        category: { type: String, default: '' },
      },
    ],
    isGrounded: {
      type: Boolean,
      default: true,
    },
    hasSufficientEvidence: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
  }
);

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'Financial Learning Session',
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    messages: [messageSchema],
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        ret.userId = ret.userId.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

conversationSchema.index({ userId: 1, updatedAt: -1 });

export const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;
