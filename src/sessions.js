import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';
import pino from './logger.js';
import makeWa from 'whatsapp-web.js';
import pool from './db.js';
const { Client, LocalAuth } = makeWa;

const logger = pino.child({ module: 'SessionManager' });
const sessions = new Map();

// ── DB helpers ──────────────────────────────────────────────────────────────

async function dbUpsertSession(id, data) {
  const sets = Object.entries(data)
    .map(([k]) => `${k} = EXCLUDED.${k}`)
    .join(', ');
  await pool.query(
    `INSERT INTO wa_sessions (id, ${Object.keys(data).join(',')})
     VALUES ($1, ${Object.values(data).map((_, i) => `$${i + 2}`).join(',')})
     ON CONFLICT (id) DO UPDATE SET ${sets}, updated_at = NOW()`,
    [id, ...Object.values(data)]
  );
}

async function dbGetSession(id) {
  const { rows } = await pool.query(
    'SELECT * FROM wa_sessions WHERE id = $1', [id]
  );
  return rows[0];
}

// ── Session ─────────────────────────────────────────────────────────────────

async function getOrCreate(sessionId) {
  if (sessions.has(sessionId)) {
    const s = sessions.get(sessionId);
    if (s.client.info) return s;
  }

  logger.info({ sessionId }, 'Creating / restoring session');

  // Restore QR from DB if session exists
  let existingQr = null;
  try {
    const dbSess = await dbGetSession(sessionId);
    if (dbSess?.qr_code) existingQr = dbSess.qr_code;
  } catch {}

  const client = new Client({
    authStrategy: new LocalAuth({
      dataPath: join(process.cwd(), 'sessions', sessionId),
    }),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
  });

  const session = {
    id: sessionId,
    client,
    ready: false,
    qr: existingQr,
    emitter: new (await import('events')).EventEmitter(),
  };

  client.on('qr', async (qr) => {
    logger.info({ sessionId }, 'QR received');
    session.qr = qr;
    session.emitter?.emit('qr', qr);
    await dbUpsertSession(sessionId, { qr_code: qr, status: 'qr' }).catch(() => {});
  });

  client.on('ready', async () => {
    logger.info({ sessionId }, 'Session ready');
    session.ready = true;
    session.qr = null;
    session.emitter?.emit('ready');
    const info = client.info;
    await dbUpsertSession(sessionId, {
      status: 'connected',
      qr_code: null,
      phone_number: info?.wid || null,
      name: info?.pushname || null,
      connected_at: new Date(),
      disconnected_at: null,
    }).catch(() => {});
  });

  client.on('message', (msg) => {
    session.emitter?.emit('message', msg);
  });

  client.on('message_create', (msg) => {
    session.emitter?.emit('message_create', msg);
  });

  client.on('message_ack', (msg, ack) => {
    session.emitter?.emit('message_ack', { msg, ack });
  });

  client.on('group_join', (n) => session.emitter?.emit('group_join', n));
  client.on('group_leave', (n) => session.emitter?.emit('group_leave', n));

  client.on('disconnected', async (reason) => {
    logger.warn({ sessionId, reason }, 'Session disconnected');
    session.ready = false;
    session.emitter?.emit('disconnected', reason);
    await dbUpsertSession(sessionId, {
      status: 'disconnected',
      disconnected_at: new Date(),
    }).catch(() => {});
  });

  sessions.set(sessionId, session);
  client.initialize();

  return session;
}

function get(sessionId) {
  return sessions.get(sessionId);
}

async function getAll() {
  try {
    const { rows } = await pool.query('SELECT * FROM wa_sessions ORDER BY created_at DESC');
    return rows.map((r) => ({
      id: r.id,
      ready: r.status === 'connected',
      hasQr: !!r.qr_code,
      phone: r.phone_number,
      name: r.name,
      status: r.status,
      connectedAt: r.connected_at,
    }));
  } catch {
    return [];
  }
}

async function destroy(sessionId) {
  const session = sessions.get(sessionId);
  if (session) {
    await session.client?.destroy().catch(() => {});
    sessions.delete(sessionId);
  }
  await pool.query('DELETE FROM wa_sessions WHERE id = $1', [sessionId]).catch(() => {});
  logger.info({ sessionId }, 'Session destroyed');
}

async function logout(sessionId) {
  const session = sessions.get(sessionId);
  if (session) {
    await session.client?.logout().catch(() => {});
    session.ready = false;
  }
  await dbUpsertSession(sessionId, { status: 'logged_out' }).catch(() => {});
  logger.info({ sessionId }, 'Session logged out');
}

export const sessionManager = { getOrCreate, get, getAll, destroy, logout };
export default sessionManager;
