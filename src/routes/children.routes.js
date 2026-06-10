import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { childrenRepo } from '../data/children.repo.js';
import { str, HttpError } from '../lib/validate.js';

export const childrenRouter = Router();
childrenRouter.use(requireAuth);

childrenRouter.get('/', (req, res) => res.json(childrenRepo.listByUser(req.userId)));

childrenRouter.post('/', (req, res, next) => {
  try {
    const name = str(req.body.name, 'name', { max: 80 });
    const color = str(req.body.color, 'color', { required: false, def: '#C85A38', max: 9 });
    res.status(201).json(childrenRepo.create(req.userId, { name, color }));
  } catch (e) { next(e); }
});

childrenRouter.patch('/:id', (req, res, next) => {
  try {
    const name = req.body.name != null ? str(req.body.name, 'name', { max: 80 }) : null;
    const color = req.body.color != null ? str(req.body.color, 'color', { max: 9 }) : null;
    const c = childrenRepo.update(req.userId, req.params.id, { name, color });
    if (!c) throw new HttpError(404, 'Child not found');
    res.json(c);
  } catch (e) { next(e); }
});

childrenRouter.delete('/:id', (req, res, next) => {
  try {
    if (!childrenRepo.remove(req.userId, req.params.id)) throw new HttpError(404, 'Child not found');
    res.status(204).end();
  } catch (e) { next(e); }
});
