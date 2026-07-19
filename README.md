# learn

My learning website — a spaced-repetition study tool for the Azure
Well-Architected Framework and Landing Zones. See `docs/PLAN.md` for the
full design and `docs/CHECKLIST.md` for implementation progress.

## Structure

npm workspaces monorepo:

- `frontend/` — React SPA (Vite + TypeScript)
- `backend/` — API (Fastify + TypeScript)

## Local development

Requires Node.js 24+.

```sh
npm install

# run each service in its own terminal
npm run dev:frontend   # http://localhost:5173
npm run dev:backend    # http://localhost:3000
```

Other useful commands (run from the repo root):

```sh
npm run lint            # lint both workspaces
npm run format           # format the whole repo with Prettier
npm run format:check     # check formatting without writing
npm run build:frontend
npm run build:backend
npm run test:backend
```

## Docker

Each service has a Dockerfile that expects the **repo root** as build
context (so it can install via the root workspace lockfile):

```sh
docker build -f backend/Dockerfile -t learn-backend .
docker build -f frontend/Dockerfile -t learn-frontend .
```
