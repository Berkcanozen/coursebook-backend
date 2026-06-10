import { verifyToken } from '../lib/token.js';
import { HttpError } from '../lib/validate.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const m = header.match(/^Bearer (.+)$/);
  if (!m) return next(new HttpError(401, 'Missing bearer token'));
  try {
    req.userId = verifyToken(m[1]).sub;
    next();
  } catch {
    next(new HttpError(401, 'Invalid or expired token'));
  }
}
