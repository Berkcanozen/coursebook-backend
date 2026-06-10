import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let _db = null;

export function getDb() {
  if (_db) return _db;
  _db = new DatabaseSync(config.dbFile);
  _db.exec('PRAGMA foreign_keys = ON;');
  _db.exec('PRAGMA journal_mode = WAL;');
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  _db.exec(schema);
  return _db;
}
