import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';
import { pino } from '../src/logger.js';
import makeWa from 'whatsapp-web.js';
const { Client, LocalAuth, Location, List, Buttons, MessageMedia } = makeWa;

const sessions = new Map();
const logger = pino.child({ module: 'SessionManager' });

class SessionManager {
  constructor() {
    this.sessionsDir = join(process.cwd(), 'sessions');
    if (!existsSync(this.sessionsDir)) {
      mkdirSync(this.sessionsDir, { recursive: true });
    }
  }

  async getOrCreate(sessionId) {
    if (sessions.has(sessionId)) {
      const session = sessions.get(sessionId);
      if (session.client.info) {
        return session;
      }
    }

    logger.info({ sessionId }, 'Creating new session');

    const client = new Client({
      authStrategy: new LocalAuth({
        dataPath: join(this.sessionsDir, sessionId),
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
      qr: null,
    };

    client.on('qr', (qr) => {
      logger.info({ sessionId }, 'QR received');
      session.qr = qr;
      session.emitter?.emit('qr', qr);
    });

    client.on('ready', () => {
      logger.info({ sessionId }, 'Session ready');
      session.ready = true;
      session.qr = null;
      session.emitter?.emit('ready');
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

    client.on('group_join', (notification) => {
      session.emitter?.emit('group_join', notification);
    });

    client.on('group_leave', (notification) => {
      session.emitter?.emit('group_leave', notification);
    });

    client.on('disconnected', (reason) => {
      logger.warn({ sessionId, reason }, 'Session disconnected');
      session.ready = false;
      session.emitter?.emit('disconnected', reason);
    });

    sessions.set(sessionId, session);
    client.initialize();

    return session;
  }

  get(sessionId) {
    return sessions.get(sessionId);
  }

  getAll() {
    return Array.from(sessions.entries()).map(([id, s]) => ({
      id,
      ready: s.ready,
      hasQr: !!s.qr,
    }));
  }

  async destroy(sessionId) {
    const session = sessions.get(sessionId);
    if (session) {
      await session.client.destroy();
      sessions.delete(sessionId);
      logger.info({ sessionId }, 'Session destroyed');
    }
  }

  async logout(sessionId) {
    const session = sessions.get(sessionId);
    if (session) {
      await session.client.logout();
      session.ready = false;
      logger.info({ sessionId }, 'Session logged out');
    }
  }
}

export const sessionManager = new SessionManager();
export default sessionManager;
