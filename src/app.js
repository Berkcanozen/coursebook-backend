import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.routes.js';
import { meRouter } from './routes/me.routes.js';
import { childrenRouter } from './routes/children.routes.js';
import { coursesRouter } from './routes/courses.routes.js';
import { sessionsRouter } from './routes/sessions.routes.js';
import { HttpError } from './lib/validate.js';
import { config } from './config.js';

export function createApp() {
  const app = express();
  // ALLOWED_ORIGIN can be a single origin, a comma-separated list, or "*".
  const origins = config.allowedOrigin === '*'
    ? '*'
    : config.allowedOrigin.split(',').map((s) => s.trim()).filter(Boolean);
  app.use(cors({ origin: origins }));
  app.use(express.json());

  app.get('/api/health', (req, res) => res.json({ ok: true, ts: new Date().toISOString() }));
  app.use('/api/auth', authRouter);
  app.use('/api/me', meRouter);
  app.use('/api/children', childrenRouter);
  app.use('/api/courses', coursesRouter);
  app.use('/api/sessions', sessionsRouter);

  app.use((req, res) => res.status(404).json({ error: 'Not found' }));
  app.use((err, req, res, next) => {
    const status = err instanceof HttpError ? err.status : 500;
    if (status === 500) console.error(err);
    res.status(status).json({ error: err.message || 'Server error' });
  });
  return app;
}
