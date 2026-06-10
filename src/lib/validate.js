export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const bad = (m) => { throw new HttpError(400, m); };

export const str = (v, name, { max = 200, required = true, def = '' } = {}) => {
  if (v == null || v === '') { if (required) bad(`${name} is required`); return def; }
  if (typeof v !== 'string') bad(`${name} must be a string`);
  const t = v.trim();
  if (t.length > max) bad(`${name} is too long (max ${max})`);
  return t;
};

export const num = (v, name, { min = 0, def = 0 } = {}) => {
  if (v == null || v === '') return def;
  const n = Number(v);
  if (Number.isNaN(n)) bad(`${name} must be a number`);
  if (n < min) bad(`${name} must be >= ${min}`);
  return n;
};

export const oneOf = (v, name, allowed, def) => {
  if (v == null) return def;
  if (!allowed.includes(v)) bad(`${name} must be one of: ${allowed.join(', ')}`);
  return v;
};

export const isoDate = (v, name) => {
  const t = str(v, name);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) bad(`${name} must be in YYYY-MM-DD format`);
  return t;
};
