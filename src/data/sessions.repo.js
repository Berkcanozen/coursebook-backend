import { randomUUID } from 'node:crypto';
import { getDb } from '../db/connection.js';

const db = () => getDb();

const OWNED = `
  SELECT s.* FROM sessions s
  JOIN courses c  ON c.id  = s.course_id
  JOIN children ch ON ch.id = c.child_id
  WHERE s.id = ? AND ch.user_id = ?`;

const USER_COURSE_IDS = `
  SELECT c.id FROM courses c JOIN children ch ON ch.id = c.child_id WHERE ch.user_id = ?`;

export const sessionsRepo = {
  courseBelongsToUser(userId, courseId) {
    return !!db().prepare(`
      SELECT 1 FROM courses c JOIN children ch ON ch.id = c.child_id
      WHERE c.id = ? AND ch.user_id = ?`).get(courseId, userId);
  },
  findOwned(userId, id) {
    return db().prepare(OWNED).get(id, userId) || null;
  },
  create(userId, courseId, d) {
    const id = randomUUID();
    db().prepare(`INSERT INTO sessions (id, course_id, date, amount, paid, note) VALUES (?,?,?,?,?,?)`)
      .run(id, courseId, d.date, d.amount, d.paid ? 1 : 0, d.note);
    return this.findOwned(userId, id);
  },
  update(userId, id, d) {
    const r = db().prepare(`
      UPDATE sessions SET
        date   = COALESCE(?, date),
        amount = COALESCE(?, amount),
        paid   = COALESCE(?, paid),
        note   = COALESCE(?, note)
      WHERE id = ? AND course_id IN (${USER_COURSE_IDS})`)
      .run(d.date ?? null, d.amount ?? null,
           d.paid == null ? null : (d.paid ? 1 : 0), d.note ?? null, id, userId);
    return r.changes ? this.findOwned(userId, id) : null;
  },
  remove(userId, id) {
    return db().prepare(
      `DELETE FROM sessions WHERE id = ? AND course_id IN (${USER_COURSE_IDS})`
    ).run(id, userId).changes > 0;
  },
};
