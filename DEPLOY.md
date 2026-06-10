# Deploying Coursebook

GitHub stores your code and can host the **static frontend** (GitHub Pages),
but it cannot run the Node/Express **backend**. So:

- Code  -> GitHub repository
- Backend (API) -> Render (or any Node host)
- Frontend (web/) -> GitHub Pages, pointed at the deployed API

---

## 1. Push the code to GitHub

From the project root:

```bash
git init
git add .
git commit -m "Coursebook: API + frontend"
git branch -M main
# create an EMPTY repo on github.com first (no README), then:
git remote add origin https://github.com/<you>/coursebook.git
git push -u origin main
```

`node_modules/`, `.env`, and `data.db` are already git-ignored.

---

## 2. Deploy the backend on Render (free)

1. Sign in to https://render.com with your GitHub account.
2. **New +  ->  Blueprint**, select your repo. Render reads `render.yaml`
   and creates the `coursebook-api` web service. `JWT_SECRET` is generated
   automatically.
3. Wait for the first deploy, then open `https://<your-service>.onrender.com/api/health`
   — you should see `{"ok":true,...}`.

Notes / gotchas:
- **Free plan sleeps** after ~15 min idle; the first request then takes
  ~30-60s to wake. Fine for personal use.
- **Data is NOT persistent on the free plan** — the SQLite file is wiped on
  every redeploy/restart. To keep data, edit `render.yaml`: switch to a paid
  plan, add the `disk` block (already shown, commented out), and set
  `DB_FILE=/var/data/data.db`. Alternatively migrate to a hosted Postgres
  later (the data layer in `src/data/` is the only place that would change).

---

## 3. Deploy the frontend on GitHub Pages

1. Edit `web/config.js` and set your API URL:
   ```js
   window.COURSEBOOK_API = "https://<your-service>.onrender.com";
   ```
   Commit and push.
2. In the repo: **Settings -> Pages -> Build and deployment -> Source:
   GitHub Actions**. The included `.github/workflows/pages.yml` publishes the
   `web/` folder on every push.
3. After the workflow runs, your app is live at
   `https://<you>.github.io/coursebook/`.

---

## 4. Connect the two (CORS)

On Render, set the service's `ALLOWED_ORIGIN` environment variable to your
Pages URL so the browser is allowed to call the API:

```
ALLOWED_ORIGIN=https://<you>.github.io
```

Save — Render redeploys. Open the Pages URL, create an account, and you're live.

---

## Production checklist
- `JWT_SECRET` is a long random value (Render generates it).
- `ALLOWED_ORIGIN` is your exact frontend origin, not `*`.
- Data persistence is configured (disk or Postgres) if you care about keeping records.
- HTTPS is automatic on both Render and GitHub Pages.
