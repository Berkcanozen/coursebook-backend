import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { coursesRepo } from '../data/courses.repo.js';
import { sessionsRepo } from '../data/sessions.repo.js';
import { str, num, oneOf, isoDate, HttpError } from '../lib/validate.js';

export const coursesRouter = Router();
coursesRouter.use(requireAuth);

const FEE_TYPES = ['session', 'month', 'term'];

function courseBody(b, partial) {
  const reqd = !partial;
  return {
    name:       (b.name != null || reqd) ? str(b.name, 'name', { max: 120, required: reqd }) : null,
    instructor: b.instructor != null ? str(b.instructor, 'instructor', { required: false, max: 120 }) : (reqd ? '' : null),
    location:   b.location   != null ? str(b.location, 'location', { required: false, max: 160 }) : (reqd ? '' : null),
    schedule:   b.schedule   != null ? str(b.schedule, 'schedule', { required: false, max: 160 }) : (reqd ? '' : null),
    fee:        (b.fee != null || reqd) ? num(b.fee, 'fee', { min: 0 }) : null,
    feeType:    (b.feeType != null || reqd) ? oneOf(b.feeType, 'feeType', FEE_TYPES, 'session') : null,
    icon:       (b.icon != null || reqd) ? str(b.icon, 'icon', { required: false, def: 'other', max: 20 }) : null,
  };
}

coursesRouter.get('/', (req, res, next) => {
  try {
    const childId = str(req.query.childId, 'childId');
    if (!coursesRepo.childBelongsToUser(req.userId, childId)) throw new HttpError(404, 'Child not found');
    res.json(coursesRepo.listByChild(req.userId, childId));
  } catch (e) { next(e); }
});

coursesRouter.post('/', (req, res, next) => {
  try {
    const childId = str(req.body.childId, 'childId');
    if (!coursesRepo.childBelongsToUser(req.userId, childId)) throw new HttpError(404, 'Child not found');
    res.status(201).json(coursesRepo.create(req.userId, childId, courseBody(req.body, false)));
  } catch (e) { next(e); }
});

coursesRouter.patch('/:id', (req, res, next) => {
  try {
    const c = coursesRepo.update(req.userId, req.params.id, courseBody(req.body, true));
    if (!c) throw new HttpError(404, 'Course not found');
    res.json(c);
  } catch (e) { next(e); }
});

coursesRouter.delete('/:id', (req, res, next) => {
  try {
    if (!coursesRepo.remove(req.userId, req.params.id)) throw new HttpError(404, 'Course not found');
    res.status(204).end();
  } catch (e) { next(e); }
});

// Log a session for a course.
coursesRouter.post('/:id/sessions', (req, res, next) => {
  try {
    if (!sessionsRepo.courseBelongsToUser(req.userId, req.params.id)) throw new HttpError(404, 'Course not found');
    const data = {
      date: isoDate(req.body.date, 'date'),
      amount: num(req.body.amount, 'amount', { min: 0 }),
      paid: !!req.body.paid,
      note: str(req.body.note, 'note', { required: false, def: '', max: 200 }),
    };
    res.status(201).json(sessionsRepo.create(req.userId, req.params.id, data));
  } catch (e) { next(e); }
});
