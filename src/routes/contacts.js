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

// GET /sessions/:sessionId/contacts - List all contacts
router.get('/sessions/:sessionId/contacts', async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;

  try {
    const contacts = await session.client.getContacts();
    res.json({
      success: true,
      contacts: contacts.map((c) => ({
        id: c.id._serialized,
        name: c.name,
        pushname: c.pushname,
        isBusiness: c.isBusiness,
        isEnterprise: c.isEnterprise,
        isMe: c.isMe,
        isGroup: c.isGroup,
        isWAContact: c.isWAContact,
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /sessions/:sessionId/contacts/:contactId - Get contact
router.get('/sessions/:sessionId/contacts/:contactId', async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;

  try {
    const contact = await session.client.getContactById(req.params.contactId);
    res.json({
      success: true,
      contact: {
        id: contact.id._serialized,
        name: contact.name,
        pushname: contact.pushname,
        number: contact.number,
        isBusiness: contact.isBusiness,
        isEnterprise: contact.isEnterprise,
        profilePicThumbObj: contact.profilePicThumbObj,
      },
    });
  } catch (err) {
    res.status(404).json({ success: false, error: 'Contact not found' });
  }
});

// GET /sessions/:sessionId/contacts/:contactId/profile-pic - Get profile picture
router.get('/sessions/:sessionId/contacts/:contactId/profile-pic', async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;

  try {
    const contact = await session.client.getContactById(req.params.contactId);
    const url = await contact.getProfilePicUrl();
    res.json({ success: true, url });
  } catch (err) {
    res.status(404).json({ success: false, error: 'No profile picture found' });
  }
});

// POST /sessions/:sessionId/contacts/:contactId/block - Block contact
router.post('/sessions/:sessionId/contacts/:contactId/block', async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;

  try {
    const contact = await session.client.getContactById(req.params.contactId);
    await contact.block();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /sessions/:sessionId/contacts/:contactId/unblock - Unblock contact
router.post('/sessions/:sessionId/contacts/:contactId/unblock', async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;

  try {
    const contact = await session.client.getContactById(req.params.contactId);
    await contact.unblock();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
