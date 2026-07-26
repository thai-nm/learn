# learn

My learning website — a spaced-repetition study tool for the Azure
Well-Architected Framework and Landing Zones. See `docs/PLAN.md` for the
full design and `docs/CHECKLIST.md` for implementation progress.

## Structure

npm workspaces monorepo:

- `frontend/` — React SPA (Vite + TypeScript)
- `backend/` — API (Express + TypeScript), persisting to a SQLite file via
  Node's built-in `node:sqlite` module (no external DB service, no extra
  dependency) — see docs/PLAN.md Section 5.

## Local development

Requires Node.js 24+. No database service or container runtime needed —
SQLite is an embedded file, created automatically on first run.

```sh
npm install

# copy env defaults (no required values for local dev — see .env.example)
cp backend/.env.example backend/.env

# run each service in its own terminal
npm run dev:frontend   # http://localhost:5173
npm run dev:backend    # http://localhost:3000
```

The backend creates its SQLite file at `backend/data/learn.db` by default
(override with `DATABASE_PATH` in `backend/.env`) and applies its schema
automatically on startup — nothing to install or start beforehand.

### Identity

There's no login, password, or SSO. On first visit the app asks for an
email address, stores it in the browser (`localStorage`), and sends it
as the `X-User-Email` header on every API request — that's the entire
identity model. The backend trusts whatever email it's sent (see
`backend/src/auth/emailIdentity.ts`); it's an identity, not an
authentication scheme, on the assumption that this is a low-stakes
personal study app, not something protecting sensitive data. Each email
gets its own private decks/cards; a deck can also be marked `shared`,
making it readable (but not editable) by every other email — that's how
the built-in starter deck works.

Other useful commands (run from the repo root):

```sh
npm run lint            # lint both workspaces
npm run format           # format the whole repo with Prettier
npm run format:check     # check formatting without writing
npm run build:frontend
npm run build:backend
npm run test:backend
npm run seed -w backend  # load the starter deck (skips if one already exists)
```

## Docker

Each service has a Dockerfile that expects the **repo root** as build
context (so it can install via the root workspace lockfile):

```sh
docker build -f backend/Dockerfile -t learn-backend .
docker build -f frontend/Dockerfile -t learn-frontend .
```

The backend has no required environment variables — `DATABASE_PATH`
defaults to `./data/learn.db` if unset. In a deployed container (e.g.
Kubernetes), set `DATABASE_PATH` to a path on a mounted persistent
volume so the SQLite file survives redeploys.
