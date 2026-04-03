import { Router } from 'express';
import NodeCache from 'node-cache';
import sessionManager from '../sessions.js';

const router = Router();
const webhookCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

function getSession(req, res) {
  const { sessionId } = req.params;
  const session = sessionManager.get(sessionId);
  if (!session) {
    return res.status(404).json({ success: false, error: 'Session not found' });
  }
  return session;
}

// POST /sessions/:sessionId/webhooks - Register webhook
router.post('/sessions/:sessionId/webhooks', (req, res) => {
  const session = getSession(req, res);
  if (!session) return;

  const { url, events } = req.body;
  if (!url) {
    return res.status(400).json({ success: false, error: 'url required' });
  }

  const allowedEvents = ['message', 'message_create', 'message_ack', 'group_join', 'group_leave', 'session_ready', 'session_disconnected'];
  const webhookEvents = Array.isArray(events) ? events.filter((e) => allowedEvents.includes(e)) : allowedEvents;

  const webhook = { url, events: webhookEvents, createdAt: Date.now() };
  webhookCache.set(`webhook:${sessionId}`, webhook);
  res.json({ success: true, webhook });
});

// GET /sessions/:sessionId/webhooks - List webhooks
router.get('/sessions/:sessionId/webhooks', (req, res) => {
  const webhook = webhookCache.get(`webhook:${req.params.sessionId}`);
  res.json({ success: true, webhook: webhook || null });
});

// DELETE /sessions/:sessionId/webhooks - Remove webhook
router.delete('/sessions/:sessionId/webhooks', (req, res) => {
  webhookCache.del(`webhook:${req.params.sessionId}`);
  res.json({ success: true });
});

// Internal: called by session events to fire webhooks
export async function fireWebhook(sessionId, event, data) {
  const webhook = webhookCache.get(`webhook:${sessionId}`);
  if (!webhook || !webhook.events.includes(event)) return;

  try {
    await fetch(webhook.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, sessionId, data, timestamp: Date.now() }),
    });
  } catch (err) {
    console.error(`Webhook failed for ${sessionId}/${event}:`, err.message);
  }
}

export { webhookCache };
export default router;
