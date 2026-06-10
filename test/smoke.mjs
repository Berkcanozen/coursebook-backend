// End-to-end smoke test: boots the app on an ephemeral port against an
// in-memory DB and exercises the full flow + ownership isolation.
process.env.DB_FILE = ':memory:';
process.env.JWT_SECRET = 'test-secret';

import assert from 'node:assert';
const { createApp } = await import('../src/app.js');

const server = createApp().listen(0);
await new Promise((r) => server.once('listening', r));
const base = `http://localhost:${server.address().port}/api`;

let token;
const H = () => ({ 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) });
const call = async (m, p, b) => {
  const r = await fetch(base + p, { method: m, headers: H(), body: b ? JSON.stringify(b) : undefined });
  return { status: r.status, d: r.status === 204 ? null : await r.json() };
};

try {
  assert.equal((await call('GET', '/health')).status, 200);

  const email = `t${Date.now()}@example.com`;
  let r = await call('POST', '/auth/register', { email, password: 'secret1', familyName: 'The Bakers', currency: 'EUR' });
  assert.equal(r.status, 201, 'register'); token = r.d.token; assert.ok(token, 'token issued');

  assert.equal((await call('POST', '/auth/register', { email, password: 'secret1', familyName: 'X' })).status, 409, 'duplicate email rejected');

  r = await call('POST', '/children', { name: 'Emma', color: '#C85A38' });
  assert.equal(r.status, 201, 'create child'); const child = r.d;

  r = await call('POST', '/courses', { childId: child.id, name: 'Piano lessons', instructor: 'Ms. Petrova', location: 'Harmony', schedule: 'Mon & Wed', fee: 25, feeType: 'session', icon: 'music' });
  assert.equal(r.status, 201, 'create course'); const course = r.d;

  r = await call('POST', `/courses/${course.id}/sessions`, { date: '2026-06-04', amount: 25, paid: true });
  assert.equal(r.status, 201, 'log session'); const ses = r.d;
  await call('POST', `/courses/${course.id}/sessions`, { date: '2026-05-28', amount: 25, paid: false });

  r = await call('PATCH', `/sessions/${ses.id}`, { paid: false });
  assert.equal(r.d.paid, 0, 'toggle paid -> unpaid');

  r = await call('GET', '/me/state');
  assert.equal(r.d.family, 'The Bakers', 'state family');
  assert.equal(r.d.children.length, 1, 'state children');
  assert.equal(r.d.children[0].courses.length, 1, 'state courses');
  assert.equal(r.d.children[0].courses[0].sessions.length, 2, 'state sessions');
  assert.equal(r.d.children[0].courses[0].feeType, 'session', 'fee_type mapped to feeType');

  // ownership isolation: a second account cannot touch the first account's data
  const other = await call('POST', '/auth/register', { email: `o${Date.now()}@example.com`, password: 'secret1', familyName: 'Other' });
  const firstToken = token; token = other.d.token;
  assert.equal((await call('DELETE', `/children/${child.id}`)).status, 404, 'cannot delete child of another family');
  assert.equal((await call('GET', '/me/state')).d.children.length, 0, 'new account starts empty');
  token = firstToken;

  assert.equal((await call('DELETE', `/courses/${course.id}`)).status, 204, 'delete course');
  assert.equal((await call('GET', '/me/state')).d.children[0].courses.length, 0, 'cascade removed sessions too');

  // unauthenticated access blocked
  token = null;
  assert.equal((await call('GET', '/me/state')).status, 401, 'auth required');

  console.log('OK - all smoke tests passed');
  server.close(); process.exit(0);
} catch (e) {
  console.error('FAILED - smoke test:', e.message);
  server.close(); process.exit(1);
}
