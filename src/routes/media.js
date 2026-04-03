import { Router } from 'express';
import { createWriteStream, existsSync } from 'fs';
import { join, extname } from 'path';
import { pipeline } from 'stream/promises';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import sessionManager from '../sessions.js';
import logger from '../logger.js';

const router = Router();

const mediaDir = join(process.cwd(), 'media');
const storage = multer.diskStorage({
  destination: mediaDir,
  filename: (req, file, cb) => {
    const unique = `${uuidv4()}${extname(file.originalname)}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
});

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

// POST /sessions/:sessionId/media/send - Send media with caption
router.post('/sessions/:sessionId/media/send', upload.single('file'), async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;

  const { chatId, caption } = req.body;
  if (!chatId) {
    return res.status(400).json({ success: false, error: 'chatId required' });
  }
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded' });
  }

  try {
    const media = await (await import('whatsapp-web.js')).default.MessageMedia.fromFilePath(req.file.path);
    const message = await session.client.sendMessage(chatId, media, { caption });
    res.json({ success: true, messageId: message.id._serialized, mediaPath: req.file.path });
  } catch (err) {
    logger.error({ err }, 'Failed to send media');
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /sessions/:sessionId/media/url - Send media from URL
router.post('/sessions/:sessionId/media/url', async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;

  const { chatId, url, caption, mimetype } = req.body;
  if (!chatId || !url) {
    return res.status(400).json({ success: false, error: 'chatId and url required' });
  }

  try {
    const media = await (await import('whatsapp-web.js')).default.MessageMedia.fromUrl(url, { mimetype });
    const message = await session.client.sendMessage(chatId, media, { caption });
    res.json({ success: true, messageId: message.id._serialized });
  } catch (err) {
    logger.error({ err }, 'Failed to send media from URL');
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /sessions/:sessionId/media/base64 - Send media from base64
router.post('/sessions/:sessionId/media/base64', async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;

  const { chatId, base64, caption, mimetype, filename } = req.body;
  if (!chatId || !base64) {
    return res.status(400).json({ success: false, error: 'chatId and base64 required' });
  }

  try {
    const media = new (await import('whatsapp-web.js')).default.MessageMedia(mimetype || 'application/octet-stream', base64, filename);
    const message = await session.client.sendMessage(chatId, media, { caption });
    res.json({ success: true, messageId: message.id._serialized });
  } catch (err) {
    logger.error({ err }, 'Failed to send base64 media');
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /sessions/:sessionId/media/:messageId - Download media from message
router.get('/sessions/:sessionId/media/:messageId', async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;

  try {
    const msg = await session.client.getMessageById(req.params.messageId);
    if (!msg.hasMedia) {
      return res.status(404).json({ success: false, error: 'No media in message' });
    }
    const media = await msg.downloadMedia();
    if (!media) {
      return res.status(404).json({ success: false, error: 'Failed to download media' });
    }
    res.json({
      success: true,
      media: {
        mimetype: media.mimetype,
        data: media.data,
        filename: media.filename,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
