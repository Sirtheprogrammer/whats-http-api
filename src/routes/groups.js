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

// GET /sessions/:sessionId/groups - List all groups
router.get('/sessions/:sessionId/groups', async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;

  try {
    const chats = await session.client.getChats();
    const groups = chats.filter((c) => c.isGroup);
    res.json({
      success: true,
      groups: groups.map((g) => ({
        id: g.id._serialized,
        name: g.name,
        participants: g.metadata?.participants?.length || 0,
        createdAt: g.metadata?.createdAt,
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /sessions/:sessionId/groups - Create group
router.post('/sessions/:sessionId/groups', async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;

  const { name, participants } = req.body;
  if (!name || !participants || participants.length < 1) {
    return res.status(400).json({ success: false, error: 'name and at least 1 participant required' });
  }

  try {
    const group = await session.client.createGroup(name, participants);
    res.json({ success: true, groupId: group.gid._serialized });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /sessions/:sessionId/groups/:groupId - Get group info
router.get('/sessions/:sessionId/groups/:groupId', async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;

  try {
    const chat = await session.client.getChatById(req.params.groupId);
    if (!chat.isGroup) {
      return res.status(400).json({ success: false, error: 'Not a group' });
    }
    res.json({
      success: true,
      group: {
        id: chat.id._serialized,
        name: chat.name,
        description: chat.metadata?.description,
        participants: chat.metadata?.participants?.map((p) => ({
          id: p.id._serialized,
          isAdmin: p.isAdmin,
          isSuperAdmin: p.isSuperAdmin,
        })),
        createdAt: chat.metadata?.createdAt,
      },
    });
  } catch (err) {
    res.status(404).json({ success: false, error: 'Group not found' });
  }
});

// PUT /sessions/:sessionId/groups/:groupId - Update group
router.put('/sessions/:sessionId/groups/:groupId', async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;

  const { name, description } = req.body;
  try {
    const chat = await session.client.getChatById(req.params.groupId);
    if (name) await chat.setSubject(name);
    if (description !== undefined) await chat.setDescription(description);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /sessions/:sessionId/groups/:groupId/leave - Leave group
router.post('/sessions/:sessionId/groups/:groupId/leave', async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;

  try {
    const chat = await session.client.getChatById(req.params.groupId);
    await chat.leave();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /sessions/:sessionId/groups/:groupId/participants/add - Add participants
router.post('/sessions/:sessionId/groups/:groupId/participants/add', async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;

  const { participants } = req.body;
  if (!participants || participants.length < 1) {
    return res.status(400).json({ success: false, error: 'participants required' });
  }

  try {
    const chat = await session.client.getChatById(req.params.groupId);
    await chat.addParticipants(participants);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /sessions/:sessionId/groups/:groupId/participants/remove - Remove participants
router.post('/sessions/:sessionId/groups/:groupId/participants/remove', async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;

  const { participants } = req.body;
  if (!participants || participants.length < 1) {
    return res.status(400).json({ success: false, error: 'participants required' });
  }

  try {
    const chat = await session.client.getChatById(req.params.groupId);
    await chat.removeParticipants(participants);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /sessions/:sessionId/groups/:groupId/promote - Promote participants to admin
router.post('/sessions/:sessionId/groups/:groupId/promote', async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;

  const { participants } = req.body;
  if (!participants || participants.length < 1) {
    return res.status(400).json({ success: false, error: 'participants required' });
  }

  try {
    const chat = await session.client.getChatById(req.params.groupId);
    await chat.promoteParticipants(participants);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /sessions/:sessionId/groups/:groupId/demote - Demote participants from admin
router.post('/sessions/:sessionId/groups/:groupId/demote', async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;

  const { participants } = req.body;
  if (!participants || participants.length < 1) {
    return res.status(400).json({ success: false, error: 'participants required' });
  }

  try {
    const chat = await session.client.getChatById(req.params.groupId);
    await chat.demoteParticipants(participants);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
