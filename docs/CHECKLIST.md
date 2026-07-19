# Implementation Checklist

Tracks progress against the phases in `docs/PLAN.md` Section 8. Check
off an item when the work is done (code merged/working, not just
started). Keep this file in sync as the source of truth for "what's
left" — update it in the same commit/PR as the work it tracks.

## Phase 1 — Repo & tooling scaffolding

- [x] Decide and set up monorepo layout (`frontend/`, `backend/`)
- [x] Frontend: Vite + React project initialized
- [x] Backend: Fastify project initialized
- [x] Shared linting/formatting config (oxlint per workspace + repo-wide
      Prettier) across both packages
- [x] Base Dockerfile for frontend
- [x] Base Dockerfile for backend
- [x] `README.md` updated with local dev setup instructions

## Phase 2 — Data & scheduling core

- [ ] Supabase project created
- [ ] `Deck` table + migration (id, title, description, topics,
      visibility)
- [ ] `Card` table + migration (id, deck_id, front, back, why, topic)
- [ ] `ReviewState` table + migration (card_id, user_id, interval_days,
      ease_factor, next_review_date, last_reviewed_at, review_count)
- [ ] SM-2 scheduling function implemented as a pure function
- [ ] Unit tests for SM-2 function covering Again/Hard/Good/Easy paths
      and interval/ease-factor edge cases (first review, failed review
      resets interval)

## Phase 3 — Backend API

- [ ] Endpoint: pull due cards (`next_review_date <= today`),
      interleaved across topics/pillars
- [ ] Endpoint: submit review grade, updates `ReviewState` via SM-2
- [ ] Endpoint: create/edit/delete Card
- [ ] Endpoint: create/edit Deck
- [ ] Backend connected to Supabase (env config, client setup)
- [ ] API-level tests (or at least smoke tests) for the above endpoints

## Phase 4 — Frontend

- [ ] Review session screen: show front, require attempt before reveal
- [ ] Reveal back + 4-point grading UI (Again/Hard/Good/Easy)
- [ ] Add/edit card form (front, back, why [optional], topic tag)
- [ ] Progress view: cards due today, mastered count, streak/stats
- [ ] Frontend wired to backend API (not calling Supabase directly)

## Phase 5 — Seed content

- [ ] Author ~20-30 starter cards spanning WAF pillars (weighted toward
      Reliability + Operational Excellence) and Landing Zone basics
- [ ] Seed script/migration to load starter deck into Supabase
- [ ] Starter deck marked `visibility: shared`

## Phase 6 — Auth & identity wiring

- [ ] Single fixed Supabase Auth account created
- [ ] Backend validates Supabase session/token on requests
- [ ] Frontend authenticates against Supabase with the fixed account
      (no signup/login UI)

## Phase 7 — Deployment & networking

- [ ] Cloudflare Tunnel configured for the homelab app
- [ ] Cloudflare Access gating the tunnel
- [ ] GitHub Actions workflow: build + test frontend/backend
- [ ] GitHub Actions workflow: authenticate onto Tailscale via OAuth
      client credentials (repo secrets)
- [ ] GitHub Actions workflow: deploy to homelab Kubernetes cluster
- [ ] Kubernetes manifests in place (owned by user)

## Phase 8 — End-to-end verification

- [ ] Full review loop dogfooded on device A
- [ ] Same account/data verified reachable and in sync on device B
- [ ] Confirm review grading on one device updates `next_review_date`
      correctly when viewed from the other
