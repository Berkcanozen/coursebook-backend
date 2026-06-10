import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { usersRepo } from '../data/users.repo.js';
import { stateRepo } from '../data/state.repo.js';
import { str } from '../lib/validate.js';

export const meRouter = Router();
meRouter.use(requireAuth);

meRouter.get('/', (req, res) => {
  const u = usersRepo.findById(req.userId);
  res.json({ id: u.id, email: u.email, family: u.family_name, currency: u.currency });
});

meRouter.patch('/', (req, res, next) => {
  try {
    const familyName = req.body.familyName != null ? str(req.body.familyName, 'familyName', { max: 120 }) : null;
    const currency = req.body.currency != null ? str(req.body.currency, 'currency', { max: 8 }) : null;
    const u = usersRepo.updateProfile(req.userId, { familyName, currency });
    res.json({ family: u.family_name, currency: u.currency });
  } catch (e) { next(e); }
});

// Full nested snapshot for the app to hydrate from in a single call.
meRouter.get('/state', (req, res) => res.json(stateRepo.fullState(req.userId)));
