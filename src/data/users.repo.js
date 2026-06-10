import { randomUUID } from 'node:crypto';
import { getDb } from '../db/connection.js';

const db = () => getDb();

export const usersRepo = {
  create({ email, passwordHash, familyName, currency }) {
    const id = randomUUID();
    db().prepare(
      `INSERT INTO users (id, email, password_hash, family_name, currency) VALUES (?,?,?,?,?)`
    ).run(id, email.toLowerCase(), passwordHash, familyName, currency);
    return this.findById(id);
  },
  findByEmail(email) {
    return db().prepare(`SELECT * FROM users WHERE email = ?`).get(email.toLowerCase()) || null;
  },
  findById(id) {
    return db().prepare(`SELECT * FROM users WHERE id = ?`).get(id) || null;
  },
  updateProfile(id, { familyName, currency }) {
    db().prepare(
      `UPDATE users SET family_name = COALESCE(?, family_name), currency = COALESCE(?, currency) WHERE id = ?`
    ).run(familyName ?? null, currency ?? null, id);
    return this.findById(id);
  },
};
