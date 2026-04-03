import rateLimit from 'express-rate-limit';
import config from '../config.js';
import logger from '../logger.js';

export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn({ ip: req.ip, path: req.path }, 'Rate limit exceeded');
    res.status(429).json({ success: false, error: 'Too many requests, slow down.' });
  },
});

export default apiLimiter;
