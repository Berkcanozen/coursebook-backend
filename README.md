# Coursebook — backend & data layer

A small REST API + SQLite data layer for the Coursebook tracker. Personal tracker,
payments-only, **one family per account**. No native build steps: it uses Node 22's
built-in `node:sqlite`, plus Express, bcrypt and JWT.

## Requirements
- Node.js **>= 22.5.0** (uses the built-in SQLite module)

## Setup
```bash
npm install
cp .env.example .env        # then edit JWT_SECRET
npm start                   # http://localhost:4000
```
Other scripts: `npm run dev` (auto-restart), `npm test` (end-to-end smoke test),
`npm run migrate` (create the DB file / ensure schema).

The schema is created automatically on first start, so `npm start` alone is enough.
Data is stored in the file set by `DB_FILE` (default `./data.db`).

## Architecture
```
src/
  config.js              env + defaults
  server.js              entrypoint (listens)
  app.js                 express app factory (routes + error handling)
  db/
    schema.sql           tables: users, children, courses, sessions
    connection.js        single SQLite connection, foreign keys on
    migrate.js           ensure schema
  data/                  <-- the data layer (repositories)
    users.repo.js
    children.repo.js
    courses.repo.js
    sessions.repo.js
    state.repo.js        assembles the nested tree the frontend uses
  middleware/auth.js     JWT bearer auth -> req.userId
  routes/                thin HTTP layer over the repositories
  lib/                   token (JWT) + validate (input checks)
client/
  api.js                 drop-in fetch client for the frontend
test/
  smoke.mjs              boots the app on :memory: and runs the full flow
```

Every repository call is scoped by `user_id`, so one account can never read or
modify another family's data (verified by the smoke test). Deletes cascade:
removing a child removes its courses and their sessions.

## Data model
- **users** — the account/family: `email`, `password_hash`, `family_name`, `currency`
- **children** — `name`, `color` (belongs to a user)
- **courses** — `name`, `instructor`, `location`, `schedule`, `fee`, `fee_type` (`session`|`month`|`term`), `icon`
- **sessions** — `date` (YYYY-MM-DD), `amount`, `paid` (0/1), `note`

## API
All routes are under `/api`. Send `Authorization: Bearer <token>` for everything
except `/auth/*` and `/health`.

| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/auth/register` | `email, password, familyName, currency?` | returns `{ token, family, currency }` |
| POST | `/auth/login` | `email, password` | returns `{ token, ... }` |
| GET | `/me` | — | account profile |
| PATCH | `/me` | `familyName?, currency?` | update family settings |
| GET | `/me/state` | — | full nested snapshot for hydration |
| GET | `/children` | — | list children |
| POST | `/children` | `name, color?` | |
| PATCH | `/children/:id` | `name?, color?` | |
| DELETE | `/children/:id` | — | cascades |
| GET | `/courses?childId=` | — | courses for a child |
| POST | `/courses` | `childId, name, instructor?, location?, schedule?, fee, feeType, icon?` | |
| PATCH | `/courses/:id` | any subset | |
| DELETE | `/courses/:id` | — | cascades |
| POST | `/courses/:id/sessions` | `date, amount, paid?, note?` | log a session |
| PATCH | `/sessions/:id` | `date?, amount?, paid?, note?` | e.g. toggle paid |
| DELETE | `/sessions/:id` | — | |

## Connecting the existing frontend
The HTML app currently persists to `window.storage`. To switch it to this backend,
include `client/api.js` and replace the local `store` calls:

```js
import { api, setToken } from './client/api.js';

// after login/register:
const { token } = await api.login(email, password);
setToken(token);

// hydrate (same shape the app already renders):
const state = await api.getState();

// mutations:
await api.addChild('Emma', '#C85A38');
await api.addCourse(childId, { name: 'Piano lessons', fee: 25, feeType: 'session', icon: 'music' });
await api.addSession(courseId, { date: '2026-06-04', amount: 25, paid: true });
await api.updateSession(sessionId, { paid: false });
```

The server sends permissive CORS headers, so the static HTML can call it directly
during development. For production, restrict CORS to your app's origin.

## Frontend (web/index.html)
`web/index.html` is the full app wired to this API — sign-in / register screen,
token kept in `localStorage`, and every action (children, courses, sessions,
paid/unpaid, family settings) goes through the endpoints above.

Run it:
1. Start the backend: `npm start` (defaults to `http://localhost:4000`).
2. Serve the page from any static server, e.g. `npx serve web` or
   `python3 -m http.server -d web 5500`, then open the shown URL.
   (Opening the file directly with `file://` also works thanks to permissive CORS.)
3. Create an account, optionally choose "Load sample data" on the home screen.

Point the app at a different API by setting `window.COURSEBOOK_API` before the
script runs (e.g. inject `<script>window.COURSEBOOK_API='https://api.example.com'</script>`
in the page head), otherwise it defaults to `http://localhost:4000`.
