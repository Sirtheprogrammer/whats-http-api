import config from '../config.js';
import logger from '../logger.js';

export function authMiddleware(req, res, next) {
  // Allow health check
  if (req.path === '/health') return next();

  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).json({ success: false, error: 'Missing X-API-Key header' });
  }
  if (apiKey !== config.apiKey) {
    logger.warn({ ip: req.ip }, 'Invalid API key attempt');
    return res.status(403).json({ success: false, error: 'Invalid API key' });
  }
  next();
}

export default authMiddleware;
