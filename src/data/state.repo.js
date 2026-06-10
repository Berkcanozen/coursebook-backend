import { getDb } from '../db/connection.js';
import { usersRepo } from './users.repo.js';

const db = () => getDb();

// Assembles the full nested tree the frontend already understands:
// { family, currency, children:[ { id,name,color, courses:[ { ..., sessions:[] } ] } ] }
export const stateRepo = {
  fullState(userId) {
    const user = usersRepo.findById(userId);
    if (!user) return null;

    const children = db().prepare(`SELECT * FROM children WHERE user_id = ? ORDER BY created_at`).all(userId);
    const courses = db().prepare(`
      SELECT c.* FROM courses c JOIN children ch ON ch.id = c.child_id
      WHERE ch.user_id = ? ORDER BY c.created_at`).all(userId);
    const sessions = db().prepare(`
      SELECT s.* FROM sessions s
      JOIN courses c  ON c.id  = s.course_id
      JOIN children ch ON ch.id = c.child_id
      WHERE ch.user_id = ? ORDER BY s.date DESC`).all(userId);

    const sessByCourse = {};
    for (const s of sessions) {
      (sessByCourse[s.course_id] ||= []).push({
        id: s.id, date: s.date, amount: s.amount, paid: !!s.paid, note: s.note || '',
      });
    }
    const coursesByChild = {};
    for (const c of courses) {
      (coursesByChild[c.child_id] ||= []).push({
        id: c.id, name: c.name, instructor: c.instructor || '', location: c.location || '',
        schedule: c.schedule || '', fee: c.fee, feeType: c.fee_type, icon: c.icon,
        sessions: sessByCourse[c.id] || [],
      });
    }
    return {
      family: user.family_name,
      currency: user.currency,
      children: children.map((ch) => ({
        id: ch.id, name: ch.name, color: ch.color, courses: coursesByChild[ch.id] || [],
      })),
    };
  },
};
