import mongoose from 'mongoose';

const knowledgeChunkSchema = new mongoose.Schema(
  {
    sourceType: {
      type: String,
      enum: ['source', 'lesson'],
      required: true,
      index: true,
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      trim: true,
      default: 'General',
    },
    chunkIndex: {
      type: Number,
      required: true,
      default: 0,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    // Tokens / keywords vector or normalized words for deterministic lexical retrieval
    keywords: {
      type: [String],
      index: true,
      default: [],
    },
    // Optional dense embedding vector for vector similarity when configured
    embedding: {
      type: [Number],
      default: [],
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'deprecated'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        ret.sourceId = ret.sourceId.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

knowledgeChunkSchema.index({ sourceType: 1, sourceId: 1, chunkIndex: 1 }, { unique: true });
knowledgeChunkSchema.index({ status: 1, category: 1 });

export const KnowledgeChunk = mongoose.model('KnowledgeChunk', knowledgeChunkSchema);
export default KnowledgeChunk;
