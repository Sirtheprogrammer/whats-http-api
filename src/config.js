import 'dotenv/config';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const config = {
  port: parseInt(process.env.PORT || '3000'),
  host: process.env.HOST || '0.0.0.0',
  apiKey: process.env.API_KEY || 'dev-key-change-me',
  sessionsDir: process.env.SESSIONS_DIR || join(__dirname, '../../sessions'),
  mediaDir: process.env.MEDIA_DIR || join(__dirname, '../../media'),
  maxMessageLength: parseInt(process.env.MAX_MESSAGE_LENGTH || '4096'),
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },
  log: {
    level: process.env.LOG_LEVEL || 'info',
    pretty: process.env.LOG_PRETTY === 'true',
  },
};

export default config;
