import { Router } from 'express';
import sessionManager from '../sessions.js';

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

// POST /sessions/:sessionId/status/text - Post text status
router.post('/sessions/:sessionId/status/text', async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;

  const { text, backgroundColor } = req.body;
  if (!text) {
    return res.status(400).json({ success: false, error: 'text required' });
  }

  try {
    await session.client.sendPresenceAvailable();
    const status = await session.client.sendMessage('status@broadcast', text, {
      backgroundColor: backgroundColor || '#25D366',
    });
    res.json({ success: true, statusId: status.id._serialized });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /sessions/:sessionId/status/media - Post media status
router.post('/sessions/:sessionId/status/media', async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;

  const { url, base64, mimetype, caption } = req.body;
  if (!url && !base64) {
    return res.status(400).json({ success: false, error: 'url or base64 required' });
  }

  try {
    const { MessageMedia } = await import('whatsapp-web.js');
    let media;
    if (url) {
      media = await MessageMedia.fromUrl(url, { mimetype });
    } else {
      media = new MessageMedia(mimetype || 'image/jpeg', base64);
    }

    await session.client.sendPresenceAvailable();
    const status = await session.client.sendMessage('status@broadcast', media, { caption });
    res.json({ success: true, statusId: status.id._serialized });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /sessions/:sessionId/status - Get my statuses
router.get('/sessions/:sessionId/status', async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;

  try {
    const chats = await session.client.getChats();
    const statuses = chats.filter((c) => c.id._serialized === 'status@broadcast');
    res.json({ success: true, statuses });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
