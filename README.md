# learn

My learning website — a spaced-repetition study tool for the Azure
Well-Architected Framework and Landing Zones. See `docs/PLAN.md` for the
full design and `docs/CHECKLIST.md` for implementation progress.

## Structure

npm workspaces monorepo:

- `frontend/` — React SPA (Vite + TypeScript)
- `backend/` — API (Express + TypeScript)
- `supabase/` — local Supabase config/migrations (DB + Auth)

## Local development

Requires Node.js 24+ and a container runtime (Docker Desktop, or podman
— see the podman note below).

```sh
npm install

# start local Supabase (Postgres + Auth + Studio), once per session
npx supabase start

# copy env defaults (local dev values are safe to commit/reuse as-is)
cp backend/.env.example backend/.env

# run each service in its own terminal
npm run dev:frontend   # http://localhost:5173
npm run dev:backend    # http://localhost:3000
```

Supabase Studio (local DB browser/editor) is at http://127.0.0.1:54323
while `supabase start` is running. Stop the stack with `npx supabase
stop` when you're done.

### Using podman instead of Docker Desktop

The Supabase CLI talks to the Docker API over a socket — a shell alias
of `docker` to `podman` isn't enough for it. Point `DOCKER_HOST` at
podman's actual socket before running `supabase` commands:

```sh
export DOCKER_HOST=$(./scripts/podman-docker-host.sh)
npx supabase start
```

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

The backend requires `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in
its environment — it fails fast with a clear error if either is
missing, rather than a confusing connection failure. Locally this comes
from `backend/.env`; in a deployed container (e.g. Kubernetes) it's
expected to be injected by the deployment manifest.
