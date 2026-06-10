import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { usersRepo } from '../data/users.repo.js';
import { signToken } from '../lib/token.js';
import { str, HttpError } from '../lib/validate.js';
import { config } from '../config.js';

export const authRouter = Router();

authRouter.post('/register', async (req, res, next) => {
  try {
    const email = str(req.body.email, 'email').toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new HttpError(400, 'Invalid email');
    const password = str(req.body.password, 'password', { max: 200 });
    if (password.length < 6) throw new HttpError(400, 'Password must be at least 6 characters');
    const familyName = str(req.body.familyName, 'familyName', { max: 120 });
    const currency = str(req.body.currency, 'currency', { required: false, def: 'EUR', max: 8 });
    if (usersRepo.findByEmail(email)) throw new HttpError(409, 'Email already registered');
    const passwordHash = await bcrypt.hash(password, config.saltRounds);
    const user = usersRepo.create({ email, passwordHash, familyName, currency });
    res.status(201).json({ token: signToken({ sub: user.id }), family: user.family_name, currency: user.currency });
  } catch (e) { next(e); }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const email = str(req.body.email, 'email').toLowerCase();
    const password = str(req.body.password, 'password');
    const user = usersRepo.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password_hash)))
      throw new HttpError(401, 'Invalid credentials');
    res.json({ token: signToken({ sub: user.id }), family: user.family_name, currency: user.currency });
  } catch (e) { next(e); }
});
