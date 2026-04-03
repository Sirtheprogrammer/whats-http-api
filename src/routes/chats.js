import { Router } from 'express';
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

// GET /sessions/:sessionId/chats - List all chats
router.get('/sessions/:sessionId/chats', async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;

  try {
    const chats = await session.client.getChats();
    res.json({
      success: true,
      chats: chats.map((c) => ({
        id: c.id._serialized,
        name: c.name,
        isGroup: c.isGroup,
        unreadCount: c.unreadCount,
        timestamp: c.timestamp,
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /sessions/:sessionId/chats/:chatId - Get chat details
router.get('/sessions/:sessionId/chats/:chatId', async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;

  try {
    const chat = await session.client.getChatById(req.params.chatId);
    res.json({
      success: true,
      chat: {
        id: chat.id._serialized,
        name: chat.name,
        isGroup: chat.isGroup,
        unreadCount: chat.unreadCount,
        timestamp: chat.timestamp,
        messages: chat.messages?.total,
      },
    });
  } catch (err) {
    res.status(404).json({ success: false, error: 'Chat not found' });
  }
});

// DELETE /sessions/:sessionId/chats/:chatId - Delete chat
router.delete('/sessions/:sessionId/chats/:chatId', async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;

  try {
    const chat = await session.client.getChatById(req.params.chatId);
    await chat.delete();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /sessions/:sessionId/chats/:chatId/archive - Archive/unarchive chat
router.post('/sessions/:sessionId/chats/:chatId/archive', async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;

  const { archive } = req.body;
  try {
    const chat = await session.client.getChatById(req.params.chatId);
    await chat.archive(archive !== false);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /sessions/:sessionId/chats/:chatId/pin - Pin/unpin chat
router.post('/sessions/:sessionId/chats/:chatId/pin', async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;

  const { pin } = req.body;
  try {
    const chat = await session.client.getChatById(req.params.chatId);
    await chat.pin(pin !== false);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /sessions/:sessionId/chats/:chatId/mute - Mute/unmute chat
router.post('/sessions/:sessionId/chats/:chatId/mute', async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;

  const { mute, duration } = req.body; // duration in seconds, or null for forever
  try {
    const chat = await session.client.getChatById(req.params.chatId);
    await chat.mute(mute !== false ? (duration ? Date.now() + duration * 1000 : null) : false);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /sessions/:sessionId/chats/:chatId/clear - Clear chat messages
router.post('/sessions/:sessionId/chats/:chatId/clear', async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;

  try {
    const chat = await session.client.getChatById(req.params.chatId);
    await chat.clearMessages();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /sessions/:sessionId/chats/:chatId/messages - Get chat messages
router.get('/sessions/:sessionId/chats/:chatId/messages', async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;

  const { limit = 50, fromMe, search } = req.query;
  try {
    const chat = await session.client.getChatById(req.params.chatId);
    const msgs = await chat.fetchMessages({ limit: parseInt(limit) });
    res.json({
      success: true,
      messages: msgs.map((m) => ({
        id: m.id._serialized,
        from: m.from,
        fromMe: m.fromMe,
        body: m.body,
        timestamp: m.timestamp,
        hasMedia: m.hasMedia,
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
