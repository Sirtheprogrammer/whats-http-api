import { Router } from 'express';
import { mkdirSync, existsSync, writeFileSync } from 'fs';
import { join, extname } from 'path';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import config from '../config.js';
import sessionManager from '../sessions.js';
import logger from '../logger.js';

const router = Router();

const mediaDir = join(process.cwd(), 'media');
if (!existsSync(mediaDir)) {
  mkdirSync(mediaDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: mediaDir,
  filename: (req, file, cb) => {
    const unique = `${uuidv4()}${extname(file.originalname)}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
});

// Helper: get session or respond with error
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

// POST /sessions - Create a new session
router.post('/sessions', async (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) {
    return res.status(400).json({ success: false, error: 'sessionId required' });
  }

  try {
    const session = await sessionManager.getOrCreate(sessionId);

    res.json({
      success: true,
      sessionId,
      status: session.ready ? 'ready' : 'connecting',
    });
  } catch (err) {
    logger.error({ err }, 'Failed to create session');
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /sessions - List all sessions
router.get('/sessions', (req, res) => {
  const sessions = sessionManager.getAll();
  res.json({ success: true, sessions });
});

// GET /sessions/:sessionId - Get session status
router.get('/sessions/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = sessionManager.get(sessionId);
  if (!session) {
    return res.status(404).json({ success: false, error: 'Session not found' });
  }
  res.json({
    success: true,
    session: {
      id: sessionId,
      ready: session.ready,
      hasQr: !!session.qr,
    },
  });
});

// GET /sessions/:sessionId/qr - Get current QR code
router.get('/sessions/:sessionId/qr', (req, res) => {
  const { sessionId } = req.params;
  const session = sessionManager.get(sessionId);
  if (!session) {
    return res.status(404).json({ success: false, error: 'Session not found' });
  }
  if (!session.qr) {
    return res.status(204).send();
  }
  res.json({ success: true, qr: session.qr });
});

// DELETE /sessions/:sessionId - Destroy session
router.delete('/sessions/:sessionId', async (req, res) => {
  try {
    await sessionManager.destroy(req.params.sessionId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /sessions/:sessionId/logout - Logout session
router.post('/sessions/:sessionId/logout', async (req, res) => {
  try {
    await sessionManager.logout(req.params.sessionId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /sessions/:sessionId/typing - Send typing indicator
router.post('/sessions/:sessionId/typing', async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;

  const { chatId, isTyping } = req.body;
  if (!chatId) {
    return res.status(400).json({ success: false, error: 'chatId required' });
  }

  try {
    await session.client.sendSeen(chatId);
    if (isTyping) {
      await session.client.startTyping(chatId);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
