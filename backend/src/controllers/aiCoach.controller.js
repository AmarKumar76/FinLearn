import { Conversation } from '../models/conversation.model.js';
import { syncKnowledgeBase, retrieveRelevantChunks } from '../utils/ragPipeline.js';
import { generateGroundedResponse } from '../utils/aiCoachService.js';

/**
 * Sync / rebuild RAG knowledge chunks
 * Can be called during init or by admin
 */
export async function syncKnowledge(req, res, next) {
  try {
    await syncKnowledgeBase();
    res.status(200).json({
      status: 'success',
      message: 'Knowledge base successfully synchronized with approved sources and lessons',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get active conversation for current authenticated user
 * GET /api/v1/ai-coach/conversation
 */
export async function getConversation(req, res, next) {
  try {
    let conversation = await Conversation.findOne({
      userId: req.user._id,
      status: 'active',
    });

    if (!conversation) {
      // Create fresh conversation with welcome message
      conversation = await Conversation.create({
        userId: req.user._id,
        messages: [
          {
            sender: 'coach',
            text: 'Namaste! I am your FinLearn Money Coach. I can explain budgeting frameworks, reducing-balance loan math, investment risk categories, and common scam red flags using verified Indian financial education sources. How can I help you today?',
            sources: [
              { title: 'FinLearn Approved Curriculum', url: '/learning' },
              { title: 'RBI Digital Lending Guidelines', url: 'https://rbi.org.in' },
            ],
            isGrounded: true,
            hasSufficientEvidence: true,
          },
        ],
      });
    }

    res.status(200).json({
      status: 'success',
      data: conversation,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Post a new query to the AI Money Coach
 * POST /api/v1/ai-coach/query
 */
export async function askCoach(req, res, next) {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Message cannot be empty',
      });
    }

    if (message.trim().length > 1000) {
      return res.status(400).json({
        status: 'fail',
        message: 'Message cannot exceed 1000 characters',
      });
    }

    const cleanQuery = message.trim();

    // 1. Ensure knowledge chunks are populated
    await syncKnowledgeBase();

    // 2. Retrieve relevant sources/lessons
    const retrievedChunks = await retrieveRelevantChunks(cleanQuery, 3, 1);

    // 3. Generate grounded response
    const coachResponse = await generateGroundedResponse({
      query: cleanQuery,
      retrievedChunks,
    });

    // 4. Persist in user's active conversation
    let conversation = await Conversation.findOne({
      userId: req.user._id,
      status: 'active',
    });

    if (!conversation) {
      conversation = new Conversation({
        userId: req.user._id,
        messages: [],
      });
    }

    // Append user message and coach message
    conversation.messages.push({
      sender: 'user',
      text: cleanQuery,
      sources: [],
    });

    conversation.messages.push({
      sender: 'coach',
      text: coachResponse.text,
      sources: coachResponse.sources,
      isGrounded: coachResponse.isGrounded,
      hasSufficientEvidence: coachResponse.hasSufficientEvidence,
    });

    // Bounded history limit (keep last 30 messages)
    if (conversation.messages.length > 30) {
      conversation.messages = conversation.messages.slice(-30);
    }

    await conversation.save();

    res.status(200).json({
      status: 'success',
      data: {
        reply: {
          sender: 'coach',
          text: coachResponse.text,
          sources: coachResponse.sources,
          isGrounded: coachResponse.isGrounded,
          hasSufficientEvidence: coachResponse.hasSufficientEvidence,
        },
        conversation,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Reset conversation history
 * POST /api/v1/ai-coach/reset
 */
export async function resetConversation(req, res, next) {
  try {
    await Conversation.updateMany(
      { userId: req.user._id, status: 'active' },
      { status: 'archived' }
    );

    const freshConversation = await Conversation.create({
      userId: req.user._id,
      messages: [
        {
          sender: 'coach',
          text: 'Session reset. Namaste! I am your FinLearn Money Coach. How can I help you explore financial education today?',
          sources: [
            { title: 'FinLearn Approved Curriculum', url: '/learning' },
          ],
          isGrounded: true,
          hasSufficientEvidence: true,
        },
      ],
    });

    res.status(200).json({
      status: 'success',
      message: 'Conversation reset successfully',
      data: freshConversation,
    });
  } catch (err) {
    next(err);
  }
}
