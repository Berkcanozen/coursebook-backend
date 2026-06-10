import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { sessionsRepo } from '../data/sessions.repo.js';
import { str, num, isoDate, HttpError } from '../lib/validate.js';

export const sessionsRouter = Router();
sessionsRouter.use(requireAuth);

sessionsRouter.patch('/:id', (req, res, next) => {
  try {
    const data = {
      date: req.body.date != null ? isoDate(req.body.date, 'date') : null,
      amount: req.body.amount != null ? num(req.body.amount, 'amount', { min: 0 }) : null,
      paid: req.body.paid != null ? !!req.body.paid : null,
      note: req.body.note != null ? str(req.body.note, 'note', { required: false, def: '', max: 200 }) : null,
    };
    const s = sessionsRepo.update(req.userId, req.params.id, data);
    if (!s) throw new HttpError(404, 'Session not found');
    res.json(s);
  } catch (e) { next(e); }
});

sessionsRouter.delete('/:id', (req, res, next) => {
  try {
    if (!sessionsRepo.remove(req.userId, req.params.id)) throw new HttpError(404, 'Session not found');
    res.status(204).end();
  } catch (e) { next(e); }
});
