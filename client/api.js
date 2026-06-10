// Drop-in API client / data layer for the Coursebook frontend.
// Set window.COURSEBOOK_API before loading if your backend is not on localhost:4000.
const BASE = (window.COURSEBOOK_API || 'http://localhost:4000') + '/api';

let token = null;
export function setToken(t) { token = t; }

async function req(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || ('HTTP ' + res.status));
  return data;
}

export const api = {
  register: (email, password, familyName, currency) =>
    req('POST', '/auth/register', { email, password, familyName, currency }),
  login: (email, password) => req('POST', '/auth/login', { email, password }),

  getState: () => req('GET', '/me/state'),
  updateFamily: (familyName, currency) => req('PATCH', '/me', { familyName, currency }),

  addChild: (name, color) => req('POST', '/children', { name, color }),
  updateChild: (id, patch) => req('PATCH', '/children/' + id, patch),
  deleteChild: (id) => req('DELETE', '/children/' + id),

  addCourse: (childId, data) => req('POST', '/courses', { childId, ...data }),
  updateCourse: (id, patch) => req('PATCH', '/courses/' + id, patch),
  deleteCourse: (id) => req('DELETE', '/courses/' + id),

  addSession: (courseId, data) => req('POST', '/courses/' + courseId + '/sessions', data),
  updateSession: (id, patch) => req('PATCH', '/sessions/' + id, patch),
  deleteSession: (id) => req('DELETE', '/sessions/' + id),
};
