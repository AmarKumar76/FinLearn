import { KnowledgeChunk } from '../models/knowledgeChunk.model.js';
import { Source } from '../models/source.model.js';
import { Lesson } from '../models/lesson.model.js';
import { Course } from '../models/course.model.js';

// Common English financial stopwords to remove during keyword extraction
const STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from', 'further',
  'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how',
  'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me', 'more', 'most', 'my', 'myself',
  'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'our', 'ours', 'ourselves',
  'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some', 'such', 'than', 'that', 'the', 'their',
  'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too',
  'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who',
  'whom', 'why', 'with', 'would', 'you', 'your', 'yours', 'yourself', 'yourselves'
]);

/**
 * Tokenizes and normalizes text into unique stems/keywords
 */
export function extractKeywords(text) {
  if (!text || typeof text !== 'string') return [];
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
  return Array.from(new Set(tokens));
}

/**
 * Splits text into bounded chunks with overlap
 * Target size: ~400-600 characters per chunk with 100 char overlap
 */
export function splitTextIntoChunks(text, maxChunkSize = 600, overlap = 100) {
  if (!text || typeof text !== 'string') return [];
  const clean = text.trim();
  if (clean.length <= maxChunkSize) return [clean];

  const chunks = [];
  let startIndex = 0;

  while (startIndex < clean.length) {
    let endIndex = startIndex + maxChunkSize;
    if (endIndex >= clean.length) {
      chunks.push(clean.substring(startIndex).trim());
      break;
    }

    // Try finding boundary (period or newline)
    const nextNewline = clean.lastIndexOf('\n', endIndex);
    const nextPeriod = clean.lastIndexOf('. ', endIndex);
    let breakPoint = Math.max(nextNewline, nextPeriod);

    if (breakPoint > startIndex + 150) {
      endIndex = breakPoint + 1;
    }

    const chunk = clean.substring(startIndex, endIndex).trim();
    if (chunk) {
      chunks.push(chunk);
    }

    startIndex = endIndex - overlap;
    if (startIndex >= clean.length - 50) break;
  }

  return chunks;
}

/**
 * Ingests all published Sources and Lessons into KnowledgeChunk collection
 */
export async function syncKnowledgeBase() {
  // 1. Ingest verified Sources
  const sources = await Source.find({ reviewStatus: 'verified' });
  for (const src of sources) {
    const rawContent = `${src.title}. ${src.description || ''} ${src.notes || ''}`.trim();
    const chunks = splitTextIntoChunks(rawContent);

    for (let i = 0; i < chunks.length; i++) {
      const chunkText = chunks[i];
      const keywords = extractKeywords(`${src.title} ${chunkText} ${src.category}`);

      await KnowledgeChunk.findOneAndUpdate(
        { sourceType: 'source', sourceId: src._id, chunkIndex: i },
        {
          sourceType: 'source',
          sourceId: src._id,
          title: src.title,
          url: src.url,
          category: src.category,
          chunkIndex: i,
          content: chunkText,
          keywords,
          status: 'active',
        },
        { upsert: true, new: true }
      );
    }
  }

  // 2. Ingest published Lessons from published Courses
  const publishedCourses = await Course.find({ status: 'published' }).select('_id');
  const courseIds = publishedCourses.map((c) => c._id);

  const lessons = await Lesson.find({
    courseId: { $in: courseIds },
    status: 'published',
  });

  for (const lesson of lessons) {
    const chunks = splitTextIntoChunks(lesson.content);
    for (let i = 0; i < chunks.length; i++) {
      const chunkText = chunks[i];
      const keywords = extractKeywords(`${lesson.title} ${chunkText}`);

      await KnowledgeChunk.findOneAndUpdate(
        { sourceType: 'lesson', sourceId: lesson._id, chunkIndex: i },
        {
          sourceType: 'lesson',
          sourceId: lesson._id,
          title: lesson.title,
          url: `/lesson?id=${lesson._id}`,
          category: 'Curriculum Lesson',
          chunkIndex: i,
          content: chunkText,
          keywords,
          status: 'active',
        },
        { upsert: true, new: true }
      );
    }
  }
}

/**
 * Lexical BM25-style keyword ranking strategy for retrieved chunks
 */
export async function retrieveRelevantChunks(query, limit = 3, minScore = 1) {
  const queryKeywords = extractKeywords(query);
  if (queryKeywords.length === 0) {
    return [];
  }

  // Find chunks sharing at least one keyword
  const candidates = await KnowledgeChunk.find({
    status: 'active',
    keywords: { $in: queryKeywords },
  }).lean();

  if (!candidates || candidates.length === 0) {
    return [];
  }

  // Score candidates based on term frequency and matching density
  const scored = candidates.map((chunk) => {
    let score = 0;
    const chunkTokens = new Set(chunk.keywords || []);
    const lowerContent = chunk.content.toLowerCase();

    for (const kw of queryKeywords) {
      if (chunkTokens.has(kw)) {
        score += 1.5;
      }
      // Bonus for exact substring match in content
      if (lowerContent.includes(kw)) {
        score += 1.0;
      }
    }

    // Title match bonus
    const lowerTitle = chunk.title.toLowerCase();
    for (const kw of queryKeywords) {
      if (lowerTitle.includes(kw)) {
        score += 2.0;
      }
    }

    return {
      chunk,
      score,
    };
  });

  // Filter by minimum score threshold and sort descending
  const filtered = scored
    .filter((s) => s.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return filtered.map((f) => ({
    title: f.chunk.title,
    url: f.chunk.url,
    category: f.chunk.category,
    content: f.chunk.content,
    score: f.score,
  }));
}
