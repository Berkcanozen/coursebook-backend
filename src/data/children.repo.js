import { randomUUID } from 'node:crypto';
import { getDb } from '../db/connection.js';

const db = () => getDb();

export const childrenRepo = {
  listByUser(userId) {
    return db().prepare(`SELECT * FROM children WHERE user_id = ? ORDER BY created_at`).all(userId);
  },
  findOwned(userId, id) {
    return db().prepare(`SELECT * FROM children WHERE id = ? AND user_id = ?`).get(id, userId) || null;
  },
  create(userId, { name, color }) {
    const id = randomUUID();
    db().prepare(`INSERT INTO children (id, user_id, name, color) VALUES (?,?,?,?)`)
      .run(id, userId, name, color);
    return this.findOwned(userId, id);
  },
  update(userId, id, { name, color }) {
    const r = db().prepare(
      `UPDATE children SET name = COALESCE(?, name), color = COALESCE(?, color) WHERE id = ? AND user_id = ?`
    ).run(name ?? null, color ?? null, id, userId);
    return r.changes ? this.findOwned(userId, id) : null;
  },
  remove(userId, id) {
    return db().prepare(`DELETE FROM children WHERE id = ? AND user_id = ?`).run(id, userId).changes > 0;
  },
};
