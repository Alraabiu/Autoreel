import { log } from '../utils/logger.js';

export function errorHandler(err, req, res, next) {
  log.error(err.stack || err.message || err);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
}