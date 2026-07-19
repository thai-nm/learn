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

- [x] Supabase project created (hosted cloud project; local dev stack
      via `supabase start` mirrors it for iteration)
- [x] `Deck` table + migration (id, title, description, topics,
      visibility) — applied to local dev DB
- [x] `Card` table + migration (id, deck_id, front, back, why, topic) —
      applied to local dev DB
- [x] `ReviewState` table + migration (card_id, user_id, interval_days,
      ease_factor, next_review_date, last_reviewed_at, review_count) —
      applied to local dev DB
- [x] Migrations applied to the hosted prod project — deployed via
      Supabase's GitHub integration (auto-applies new
      `supabase/migrations/*.sql` files on push to `main`); confirmed
      in `supabase_migrations.schema_migrations` (dashboard can lag a
      bit before showing it in the Migrations tab)
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
- [x] Backend connected to Postgres — `PostgresRepository` implements
      the `Repository` interface via plain `pg` (node-postgres) against
      `DATABASE_URL`, deliberately not the Supabase SDK/PostgREST layer,
      so Supabase is used only as a hosted Postgres provider — swapping
      to any other Postgres later is just changing the connection
      string. `getPostgresConfig()` reads `DATABASE_URL` from the
      environment with no hardcoded fallback. Verified end-to-end
      against `supabase start` (local Postgres) and in the built Docker
      image with env vars passed like a container runtime would.
      `InMemoryRepository` is kept for fast unit/API tests, not used at
      runtime anymore.
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
- [x] Seed script/migration to load starter deck into Supabase —
      `npm run seed -w backend` runs `seedStarterDeck()` against
      `PostgresRepository`, skipping if a shared deck already exists.
      Run against local `supabase start`. **For prod**: don't run this
      locally against prod credentials — run the compiled script
      (`dist/seed/run.js`) as a one-off `kubectl run`/Job in-cluster,
      reusing the backend Deployment's existing secret, once that
      exists (Phase 7).
- [x] Starter deck marked `visibility: shared`

## Phase 6 — Auth & identity wiring

**Redesigned from the original plan**: instead of a single fixed
Supabase Auth account, identity now comes from Cloudflare Access
(Google/GitHub sign-in), enabling real multi-user sharing of one
deployment — each authenticated visitor gets their own `ReviewState`
progress, not a shared identity. See docs/PLAN.md Section 5.

- [x] Backend trusts Cloudflare Access's signed JWT assertion —
      `createCloudflareAccessVerifier()` (`backend/src/auth/cloudflareAccess.ts`)
      verifies the `Cf-Access-Jwt-Assertion` header against Cloudflare's
      JWKS for the configured team domain (`jose`, `CF_ACCESS_TEAM_DOMAIN`
      / `CF_ACCESS_AUD` env vars) and extracts the real verified email.
      `requireAuth` middleware attaches it to the request; `/health`
      stays public, everything else requires it.
- [x] `ReviewState` scoped by real per-user identity — `routes/reviews.ts`
      uses the authenticated user's email (not a fixed constant) for
      every due-card pull and grade submission, so multiple real people
      reviewing the same shared deck each get independent scheduling.
      `Deck`/`Card` stay global/shared for now — per-user personal decks
      are a separate, not-yet-requested feature.
- [x] Local dev bypass — there's no way to produce a real
      Cloudflare-signed assertion outside their infrastructure, so
      `createDevVerifier()` authenticates every request as a fixed
      identity from `DEV_USER_EMAIL` (`backend/.env`, never set in the
      deployed environment) instead. `index.ts` picks Cloudflare
      verification vs. the dev bypass based on whether `DEV_USER_EMAIL`
      is set. Verified end-to-end locally and in the built Docker image.
- [ ] **Needs your Cloudflare setup** (Phase 7): create the Access
      Application with Google/GitHub as identity provider, note its
      team domain and Application Audience tag for `CF_ACCESS_TEAM_DOMAIN`
      / `CF_ACCESS_AUD` in the prod deployment — the real verifier can't
      be exercised against a live Cloudflare Access app until that
      exists.
- [ ] Path-based Access policy: gate the app path (e.g. `/app/*`) but
      leave a public landing page path unprotected, once that page
      exists (depends on the Claude Design redesign).

## Phase 7 — Deployment & networking

- [ ] Cloudflare Tunnel configured for the homelab app
- [ ] Cloudflare Access gating the tunnel
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
