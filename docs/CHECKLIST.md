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
- [x] Backend connected to Supabase (env config, client setup) —
      `SupabaseRepository` implements the `Repository` interface via
      `@supabase/supabase-js` (service_role key, RLS bypassed by
      design). `getSupabaseConfig()` reads `SUPABASE_URL` /
      `SUPABASE_SERVICE_ROLE_KEY` from the environment with no
      hardcoded fallback — local dev via `backend/.env`, deployed
      containers via injected env (e.g. a Kubernetes manifest later).
      Verified end-to-end against `supabase start` (local Postgres) and
      in the built Docker image with env vars passed like a container
      runtime would. `InMemoryRepository` is kept for fast unit/API
      tests, not used at runtime anymore.
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
      `SupabaseRepository`, skipping if a shared deck already exists.
      Run against local `supabase start`; run it again pointed at prod
      env vars once the app is deployed there.
- [x] Starter deck marked `visibility: shared`

## Phase 6 — Auth & identity wiring

- [x] Single fixed Supabase Auth account created — `owner@waf-study.local`
      via `npm run auth:create-fixed-user -w backend` (local dev done;
      re-run against prod env vars once deployed)
- [x] Backend validates Supabase session/token on requests — `requireAuth`
      middleware verifies the bearer token via Supabase Auth and checks
      it belongs to the fixed account's email; `/health` and
      `POST /api/auth/session` stay public (the latter is the login
      mechanism itself). Note: `ReviewState` still keys off the
      existing `FIXED_USER_ID` constant, not the real auth user id —
      the auth check is a gate, not (yet) a data-scoping change.
- [x] Frontend authenticates against Supabase with the fixed account
      (no signup/login UI) — `frontend/src/api.ts` silently calls
      `POST /api/auth/session` on first request and caches the token;
      the password never reaches the browser (signed in server-side).
      Verified end-to-end: no token → 401, valid token → 200, expired/
      bogus token → 401 with one automatic retry-after-refetch.

## Phase 7 — Deployment & networking

- [ ] Cloudflare Tunnel configured for the homelab app
- [ ] Cloudflare Access gating the tunnel
- [x] GitHub Actions workflow: build + test frontend/backend —
      `.github/workflows/ci.yml`, runs lint, format check, both builds,
      and backend tests on push to `main` and on PRs
- [ ] GitHub Actions workflow: authenticate onto Tailscale via OAuth
      client credentials (repo secrets)
- [ ] GitHub Actions workflow: deploy to homelab Kubernetes cluster
- [ ] Kubernetes manifests in place (owned by user)

## Phase 8 — End-to-end verification

- [ ] Full review loop dogfooded on device A
- [ ] Same account/data verified reachable and in sync on device B
- [ ] Confirm review grading on one device updates `next_review_date`
      correctly when viewed from the other
