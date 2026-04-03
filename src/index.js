import 'dotenv/config';
import express from 'express';
import config from './config.js';
import logger from './logger.js';
import sessionManager from './sessions.js';
import { authMiddleware } from './middleware/auth.js';
import { apiLimiter } from './middleware/rateLimit.js';
import sessionsRouter from './routes/sessions.js';
import messagesRouter from './routes/messages.js';
import chatsRouter from './routes/chats.js';
import contactsRouter from './routes/contacts.js';
import groupsRouter from './routes/groups.js';
import mediaRouter from './routes/media.js';
import statusRouter from './routes/status.js';
import webhooksRouter from './routes/webhooks.js';

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Apply auth + rate limiting to API routes
app.use('/api', authMiddleware, apiLimiter);

// Mount routes under /api
app.use('/api', sessionsRouter);
app.use('/api', messagesRouter);
app.use('/api', chatsRouter);
app.use('/api', contactsRouter);
app.use('/api', groupsRouter);
app.use('/api', mediaRouter);
app.use('/api', statusRouter);
app.use('/api', webhooksRouter);

// Also expose session management at root for convenience
app.use('/', sessionsRouter);

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.path} not found` });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error({ err, path: req.path }, 'Unhandled error');
  res.status(500).json({ success: false, error: 'Internal server error' });
});

app.listen(config.port, config.host, () => {
  logger.info(`WhatsApp HTTP API running on ${config.host}:${config.port}`);
  logger.info(`Health check: http://${config.host}:${config.port}/health`);
});
