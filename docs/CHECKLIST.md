# Implementation Checklist

Tracks progress against the phases in `docs/PLAN.md` Section 8. Check
off an item when the work is done (code merged/working, not just
started). Keep this file in sync as the source of truth for "what's
left" — update it in the same commit/PR as the work it tracks.

## Phase 1 — Repo & tooling scaffolding

- [x] Decide and set up monorepo layout (`frontend/`, `backend/`)
- [x] Frontend: Vite + React project initialized
- [x] Backend: Express project initialized
- [x] Shared linting/formatting config (oxlint per workspace + repo-wide
      Prettier) across both packages
- [x] Base Dockerfile for frontend
- [x] Base Dockerfile for backend
- [x] `README.md` updated with local dev setup instructions

## Phase 2 — Data & scheduling core

- [x] **Migrated off Supabase/Postgres to embedded SQLite** (2026-07-26)
      — the app is a single backend instance with no need for a managed
      Postgres service; SQLite via Node's built-in `node:sqlite` module
      removes an external dependency, the Supabase CLI/Docker
      requirement for local dev, and the separate migrations pipeline.
      `SqliteRepository` (`backend/src/repositories/sqliteRepository.ts`)
      replaced `PostgresRepository`; `supabase/` and
      `scripts/podman-docker-host.sh` were removed.
- [x] `Deck`/`Card`/`ReviewState` schema (per Section 3) — defined in
      `backend/src/db/schema.ts`, applied idempotently on every backend
      startup (no separate migration step/CLI)
- [x] SM-2 scheduling function implemented as a pure function
- [x] Unit tests for SM-2 function covering Again/Hard/Good/Easy paths
      and interval/ease-factor edge cases (first review, failed review
      resets interval)

## Phase 3 — Backend API

- [x] Endpoint: pull due cards (`next_review_date <= today`),
      interleaved across topics/pillars
- [x] Endpoint: submit review grade, updates `ReviewState` via SM-2
- [x] Endpoint: create/edit/delete Card
- [x] Endpoint: create/edit Deck
- [x] Backend connected to SQLite — `SqliteRepository` implements the
      `Repository` interface via `node:sqlite` against a file path from
      `getSqliteConfig()` (`DATABASE_PATH`, defaulting to
      `./data/learn.db`). Verified end-to-end via direct repository
      calls and live HTTP requests against a running server. `prod`
      needs `DATABASE_PATH` pointed at a mounted persistent volume so
      the file survives redeploys (Phase 7). `InMemoryRepository` is
      kept for fast unit/API tests, not used at runtime anymore.
- [x] API-level tests (or at least smoke tests) for the above endpoints

## Phase 4 — Frontend

- [x] Review session screen: show front, require attempt before reveal
      (optional scratch note + required "Reveal Answer" click)
- [x] Reveal back + 4-point grading UI (Again/Hard/Good/Easy)
- [x] Add/edit card form (front, back, why [optional], topic tag)
- [x] Progress view: cards due today, total cards, and a best-effort
      "mastered" count — the backend has no endpoint returning
      ReviewState for non-due cards, so this is tracked client-side in
      localStorage per browser and the UI states that limitation
      explicitly rather than faking a global figure. A real fix would
      add a backend stats endpoint.
- [x] Frontend wired to backend API (not calling Supabase directly) —
      via a relative `/api/...` fetch client and a Vite dev-server
      proxy to the backend. **Known gap:** that proxy only exists in
      `vite dev`; the production nginx container (Phase 7) will need
      its own reverse-proxy rule or the backend will need CORS, since
      neither exists yet.

## Phase 5 — Seed content

- [x] Author ~20-30 starter cards spanning WAF pillars (weighted toward
      Reliability + Operational Excellence) and Landing Zone basics
      (26 cards in `backend/src/seed/starterDeck.ts`)
- [x] Seed script to load the starter deck — `npm run seed -w backend`
      runs `seedStarterDeck()` against `SqliteRepository`, skipping if a
      shared deck already exists. **For prod**: run the compiled script
      (`dist/seed/run.js`) as a one-off `kubectl run`/Job in-cluster
      against the same mounted volume as the backend Deployment, once
      that exists (Phase 7).
- [x] Starter deck marked `visibility: shared`

## Phase 6 — Identity wiring

**Redesigned twice**: originally a single fixed Supabase Auth account,
then Cloudflare Access (Google/GitHub sign-in) for real multi-user
sharing with edge-verified identity. **Now (2026-07-26)**: replaced
Cloudflare Access entirely with a self-declared email — no password, no
SSO, no login UI, no edge dependency. The client sends whatever email it
wants to act as; the backend trusts it unverified. Each email owns its
own private `Deck`s/`Card`s; a `shared` deck is readable by everyone
with independent `ReviewState` per email. See docs/PLAN.md Section 5 for
the accepted trade-off (anyone who knows/guesses an email can access
that email's data).

- [x] Email-identity verifier — `createEmailIdentityVerifier()`
      (`backend/src/auth/emailIdentity.ts`) reads the `X-User-Email`
      header, trims/lowercases it, validates basic email shape, and
      rejects (401) if missing/malformed. `requireAuth` middleware
      attaches it to the request; `/health` stays public, everything
      else requires it. `cloudflareAccess.ts`/`devVerifier.ts` and the
      `jose` dependency were removed — no more local-vs-prod branching
      in `index.ts`, since the same scheme works everywhere.
- [x] `Deck` ownership + `ReviewState` scoped by email — `Deck.ownerEmail`
      gates read/write (`domain/access.ts`: `canReadDeck` allows owner or
      any `shared` deck, `canWriteDeck` requires ownership); routes
      return 404 for decks you can't read and 403 for mutations on decks
      you don't own. `getDueCards`/`listDecks` filter to owned + shared
      decks. A personal deck ("My Cards") is auto-provisioned the first
      time a new email calls `GET /api/decks`.
- [x] Frontend email-entry gate — `EmailGate.tsx` prompts for an email
      on first visit (client-side format validation only), stores it in
      `localStorage` (`identity.ts`), and `api.ts` sends it as
      `X-User-Email` on every request. A "switch email" control in the
      header clears it and re-prompts. Verified end-to-end in a real
      browser (Playwright): gate → invalid-email rejection → login →
      add card → review → grade → progress stats → switch → relogin
      with state intact, zero console errors.

## Phase 7 — Deployment & networking

- [ ] Cloudflare Tunnel configured for the homelab app (no Access
      gate needed — see Phase 6)
- [x] GitHub Actions workflow: build + test frontend/backend —
      `.github/workflows/ci.yml`, runs lint, format check, both builds,
      and backend tests on push to `main` and on PRs
- [x] GitHub Actions workflows: build + push Docker images —
      `.github/workflows/backend-deploy.yml` and `frontend-deploy.yml`,
      separate path-filtered pipelines that `docker build` each
      service's Dockerfile and push `latest` + short-SHA tags to Docker
      Hub (`nm-thai/recall-backend`, `nm-thai/recall-frontend`) on
      push to `main`
- [ ] GitHub Actions workflow: authenticate onto Tailscale and run the
      k8s rollout (`kubectl set image`/`rollout restart`) against the
      homelab cluster once manifests exist
- [ ] Kubernetes manifests in place (owned by user), referencing the
      Docker Hub images above

## Phase 8 — End-to-end verification

- [ ] Full review loop dogfooded on device A
- [ ] Same account/data verified reachable and in sync on device B
- [ ] Confirm review grading on one device updates `next_review_date`
      correctly when viewed from the other
