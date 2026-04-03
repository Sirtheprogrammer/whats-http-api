import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import sessionManager from '../sessions.js';
import logger from '../logger.js';

const router = Router();

function getSession(req, res) {
  const { sessionId } = req.params;
  const session = sessionManager.get(sessionId);
  if (!session) {
    return res.status(404).json({ success: false, error: 'Session not found' });
  }
  if (!session.ready) {
    return res.status(503).json({ success: false, error: 'Session not ready' });
  }
  return session;
}

// POST /sessions/:sessionId/messages/text - Send text message
router.post('/sessions/:sessionId/messages/text', async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;

  const { chatId, text, mentions } = req.body;
  if (!chatId || !text) {
    return res.status(400).json({ success: false, error: 'chatId and text required' });
  }

  try {
    const message = await session.client.sendMessage(chatId, text, {
      mentions: mentions ? [mentions] : undefined,
    });
    res.json({ success: true, messageId: message.id._serialized });
  } catch (err) {
    logger.error({ err }, 'Failed to send text message');
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /sessions/:sessionId/messages/reply - Reply to a message
router.post('/sessions/:sessionId/messages/reply', async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;

  const { chatId, text, messageId, mentions } = req.body;
  if (!chatId || !text || !messageId) {
    return res.status(400).json({ success: false, error: 'chatId, text, and messageId required' });
  }

  try {
    const message = await session.client.sendMessage(chatId, text, {
      quotedMessage: { id: messageId },
      mentions: mentions ? [mentions] : undefined,
    });
    res.json({ success: true, messageId: message.id._serialized });
  } catch (err) {
    logger.error({ err }, 'Failed to send reply');
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /sessions/:sessionId/messages/react - React to a message
router.post('/sessions/:sessionId/messages/react', async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;

  const { chatId, messageId, reaction } = req.body;
  if (!chatId || !messageId || reaction === undefined) {
    return res.status(400).json({ success: false, error: 'chatId, messageId, and reaction required' });
  }

  try {
    await session.client.sendMessage(chatId, reaction, {
      quotedMessage: { id: messageId },
    });
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, 'Failed to react to message');
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /sessions/:sessionId/messages/poll - Send poll
router.post('/sessions/:sessionId/messages/poll', async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;

  const { chatId, title, options, singleSelect } = req.body;
  if (!chatId || !title || !options || options.length < 2) {
    return res.status(400).json({ success: false, error: 'chatId, title, and at least 2 options required' });
  }

  try {
    await session.client.sendMessage(chatId, {
      poll: { name: title, values: options, singleSelect: singleSelect ?? false },
    });
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, 'Failed to send poll');
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /sessions/:sessionId/messages/location - Send location
router.post('/sessions/:sessionId/messages/location', async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;

  const { chatId, latitude, longitude, title } = req.body;
  if (!chatId || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ success: false, error: 'chatId, latitude, and longitude required' });
  }

  try {
    await session.client.sendMessage(chatId, {
      location: { lat: latitude, lng: longitude, title: title || '' },
    });
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, 'Failed to send location');
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /sessions/:sessionId/messages/buttons - Send buttons message
router.post('/sessions/:sessionId/messages/buttons', async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;

  const { chatId, text, buttons, title, footer } = req.body;
  if (!chatId || !text || !buttons || buttons.length < 1) {
    return res.status(400).json({ success: false, error: 'chatId, text, and at least 1 button required' });
  }

  try {
    await session.client.sendMessage(chatId, text, {
      buttons: buttons.map((b, i) => ({ id: b.id || `btn_${i}`, body: b.text })),
      title: title || undefined,
      footer: footer || undefined,
    });
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, 'Failed to send buttons');
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /sessions/:sessionId/messages/list - Send list message
router.post('/sessions/:sessionId/messages/list', async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;

  const { chatId, text, button, sections } = req.body;
  if (!chatId || !text || !sections || sections.length < 1) {
    return res.status(400).json({ success: false, error: 'chatId, text, and sections required' });
  }

  try {
    await session.client.sendMessage(chatId, text, {
      list: { button: button || 'Select', sections },
    });
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, 'Failed to send list');
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /sessions/:sessionId/messages/:messageId - Get message by ID
router.get('/sessions/:sessionId/messages/:messageId', async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;

  try {
    const msg = await session.client.getMessageById(req.params.messageId);
    res.json({ success: true, message: msg });
  } catch (err) {
    res.status(404).json({ success: false, error: 'Message not found' });
  }
});

export default router;
