const { handleChatMessage } = require('../services/chatbotService');

/**
 * POST /api/v1/public/chat
 * Public landing chatbot. Replaces the old Next.js /api/chat route.
 */
exports.publicChat = async (req, res) => {
  try {
    const message = req.body?.message;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const payload = await handleChatMessage(message);
    return res.json(payload);
  } catch (error) {
    const status = error.statusCode || 500;
    if (status === 400) {
      return res.status(400).json({ error: error.message || 'Message is required' });
    }
    console.error('Chat API Error:', error);
    return res.status(500).json({
      reply:
        'Welcome to House & Sky Real Estate Advisory. Leave your phone number to receive our latest luxury property price sheet directly on WhatsApp!',
      properties: [],
      leadCaptured: false,
      showLeadForm: true,
      timestamp: new Date().toISOString(),
    });
  }
};
