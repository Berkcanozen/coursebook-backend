import { randomUUID } from 'node:crypto';
import { getDb } from '../db/connection.js';

const db = () => getDb();

const OWNED = `
  SELECT c.* FROM courses c
  JOIN children ch ON ch.id = c.child_id
  WHERE c.id = ? AND ch.user_id = ?`;

export const coursesRepo = {
  childBelongsToUser(userId, childId) {
    return !!db().prepare(`SELECT 1 FROM children WHERE id = ? AND user_id = ?`).get(childId, userId);
  },
  listByChild(userId, childId) {
    return db().prepare(`
      SELECT c.* FROM courses c
      JOIN children ch ON ch.id = c.child_id
      WHERE c.child_id = ? AND ch.user_id = ?
      ORDER BY c.created_at`).all(childId, userId);
  },
  findOwned(userId, id) {
    return db().prepare(OWNED).get(id, userId) || null;
  },
  create(userId, childId, d) {
    const id = randomUUID();
    db().prepare(`
      INSERT INTO courses (id, child_id, name, instructor, location, schedule, fee, fee_type, icon)
      VALUES (?,?,?,?,?,?,?,?,?)`)
      .run(id, childId, d.name, d.instructor, d.location, d.schedule, d.fee, d.feeType, d.icon);
    return this.findOwned(userId, id);
  },
  update(userId, id, d) {
    const r = db().prepare(`
      UPDATE courses SET
        name       = COALESCE(?, name),
        instructor = COALESCE(?, instructor),
        location   = COALESCE(?, location),
        schedule   = COALESCE(?, schedule),
        fee        = COALESCE(?, fee),
        fee_type   = COALESCE(?, fee_type),
        icon       = COALESCE(?, icon)
      WHERE id = ? AND child_id IN (SELECT id FROM children WHERE user_id = ?)`)
      .run(d.name ?? null, d.instructor ?? null, d.location ?? null, d.schedule ?? null,
           d.fee ?? null, d.feeType ?? null, d.icon ?? null, id, userId);
    return r.changes ? this.findOwned(userId, id) : null;
  },
  remove(userId, id) {
    return db().prepare(
      `DELETE FROM courses WHERE id = ? AND child_id IN (SELECT id FROM children WHERE user_id = ?)`
    ).run(id, userId).changes > 0;
  },
};
