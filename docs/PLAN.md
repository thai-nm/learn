# WAF / Landing Zones Spaced-Repetition Learning App — Plan

## 1. Purpose

A personal learning tool to study the Azure Well-Architected Framework (WAF)
and Azure Landing Zones, built around evidence-based learning methods rather
than a static quiz or notes app. Data model splits shareable card content
from personal review progress, so the same deployment can genuinely be
shared with other DevOps/Cloud practitioners — each visitor gets their own
independent review progress on the same shared deck, not a copy of the app. Cross-device access (studying from more than one computer)
is a real v1 requirement, met via a self-hosted backend rather than
browser-only storage.

**Non-goal for v1:** no password/SSO login flow — identity is a
self-declared email entered once in the app and stored in the browser
(see Section 5). Each email owns its own private decks/cards; a deck can
also be marked `shared`, visible (read-only) to every other email — how
the starter deck works. AI-generated card content remains out of scope.

---

## 2. Learning methodology behind the design

Each mechanism below maps directly to a feature in Section 4 — the two
should stay traceable to each other as the app evolves.

- **Forgetting curve (Ebbinghaus, 1885):** memory decays ~exponentially
  without reinforcement (~50% loss within a day, ~70% within a week). Each
  successful retrieval before the memory fully decays flattens the next
  decay curve, so well-timed review needs progressively fewer repetitions.
  → Basis for having a scheduler at all.

- **Spacing effect (Cepeda et al., 2006):** distributed practice
  outperforms massed practice ("cramming") for long-term retention across
  material types. Optimal gaps scale with how long retention is needed.
  → Implemented via an SM-2-style scheduler (same family of algorithm as
  Anki): each successful recall multiplies the interval by an ease factor
  (~2.5x default); a failed recall resets the interval.

- **Testing effect / retrieval practice (Roediger & Karpicke, 2006):**
  being tested on material (even repeatedly failing) produces better
  long-term recall than passively re-reading it the same number of times,
  despite lower in-the-moment confidence.
  → The app must show the question and require an attempt _before_
  revealing the answer. The attempt gap is the actual learning event, not
  the reveal.

- **Desirable difficulties (Bjork & Bjork, 2011):** conditions that feel
  harder in the moment (spacing, interleaving, testing) produce worse
  immediate performance but better long-term retention — the opposite of
  what learners intuitively prefer.
  → Design principle: don't optimize the UX for making the user feel
  confident today; optimize for retention weeks later.

- **Interleaving (Rohrer & Taylor, 2007):** mixed-topic practice
  underperforms blocked practice _during_ the session but roughly doubles
  later test performance, because it forces discrimination of _which_
  concept applies rather than pattern-matching by proximity.
  → Due cards are pulled interleaved across all pillars/topics by default,
  never grouped/blocked by topic.

- **Generation effect (Slamecka & Graf, 1978) / self-explanation (Chi et
  al., 1994):** self-produced information and self-explanations are
  retained better than material merely read or copied.
  → Cards should ideally be authored by the user from their own retrieval
  gaps (a real question they got wrong or explained shakily), not copied
  verbatim from docs. A "why does this matter" field on each card
  encourages self-explanation at encoding time.

---

## 3. Data model

Split **card content** (shareable, mostly static) from **review state**
(personal, per-user progress) from the start — this is the key decision
that makes sharing/publishing possible later without a schema migration.

```
Deck
  - id
  - owner_email          // whoever created it; the identity from Section 5
  - title
  - description
  - topics: [ ]          // e.g. Reliability, Operational Excellence, Landing Zones
  - visibility: personal | shared   // personal: owner only. shared: everyone can read/review, only owner can edit

Card (belongs to a Deck)
  - id
  - deck_id
  - front (question)
  - back (answer)
  - why (optional — self-explanation / rationale field)
  - topic/pillar tag

ReviewState (per user, per card — separate structure from Card)
  - card_id
  - user_id              // the same email identity as Deck.owner_email
  - interval_days
  - ease_factor
  - next_review_date
  - last_reviewed_at
  - review_count
```

Storage API mapping (DB-backed, self-hosted backend):

- Deck + Card content → rows carry the `visibility` field already in the
  schema (`personal` vs `shared`); `shared` decks (e.g. the seeded
  starter deck) are what would be exported/published for others to
  import.
- ReviewState → always personal, keyed by `deck_id:card_id` (and later
  `user_id` once multi-user exists).

This split enables later, without a rewrite:

- Publishing the starter deck as shared content that others can import,
  while each person's own review progress stays personal.
- Community-contributed cards to a shared deck without affecting anyone
  else's scheduling.
- Forking a shared deck into a personal copy to customize.

---

## 4. Features (v1 scope)

1. **Review session** — pull cards where `next_review_date <= today`,
   show front, require a self-attempt, then reveal back. User self-grades
   (Again / Hard / Good / Easy), which updates `interval_days` and
   `ease_factor` via SM-2-style logic.
2. **Interleaved review by default** — due cards pulled mixed across all
   topics/pillars, not grouped by pillar.
3. **Add/edit cards** — simple form (front, back, why, topic tag) so the
   user can add cards as new concepts come up in real work.
4. **Seed deck** — pre-populate ~20-30 starter cards spanning WAF pillars
   (weighted toward Reliability + Operational Excellence) and Landing Zone
   basics.
5. **Progress view** — cards due today, cards "mastered" (interval above
   some threshold, e.g. 21+ days), simple streak/stats. Lightweight, not a
   full analytics dashboard.

---

## 5. Technical approach

- **Frontend**: React SPA (Vite build) — no longer a build-step-free
  artifact; this is a real git repo with a normal frontend build/deploy
  flow.
- **Backend**: a lightweight Node API (Express — popular, simple,
  minimal ceremony) holding the SM-2 scheduling/review-session logic in
  front of the database. Frontend and backend both deploy as containers
  in the user's homelab.
- **Database**: SQLite, embedded directly in the backend process via
  Node's built-in `node:sqlite` module — no external DB service, no
  extra dependency, nothing to provision or operate. The app is a single
  backend instance, so SQLite's single-writer model is not a constraint.
  The data file lives on a persistent volume mounted into the backend's
  container in the homelab (`DATABASE_PATH`), so it survives redeploys;
  backup is a matter of copying that one file.
- **Auth**: no password, no SSO, no login flow. The client sends the
  email it wants to act as in an `X-User-Email` header — entered once in
  a lightweight in-app prompt and stored in the browser — and the
  backend trusts it as-is (`backend/src/auth/emailIdentity.ts`); this is
  an identity, not authentication. This makes real multi-user use
  possible without any login UI: each declared email owns its own
  private decks/cards (`Deck.owner_email`), or can review a `shared`
  deck (e.g. the starter deck) with independent progress
  (`ReviewState.user_id`). Deliberate trade-off: anyone who knows or
  guesses another person's email can access that email's data — accepted
  because this is a low-stakes personal study tool, not a design to
  reuse anywhere real verification matters.
- **Networking**: the homelab app is exposed via Cloudflare Tunnel. No
  edge-level auth gate — the email-identity model above is the entire
  access control story.
- **CI/CD**: GitHub Actions workflows live in this repo. `ci.yml` runs
  lint/format/build/test on push and PRs. Image builds are two
  separate, path-filtered pipelines — `backend-deploy.yml` and
  `frontend-deploy.yml` — each running `docker build` (not `npm`) on
  its own Dockerfile and pushing `latest` + short-SHA tags to Docker
  Hub on push to `main`. Actually rolling the new image out to the
  homelab Kubernetes cluster (authenticating onto Tailscale, running
  `kubectl`) is a later step, added once the cluster manifests exist.
  Database schema changes ship with the app itself — the backend applies
  its SQLite schema (idempotent `create table if not exists` statements)
  on every startup, so there's no separate migration pipeline to run.
- **Orchestration**: the homelab runs Kubernetes. Deployment manifests/
  setup are owned by the user directly, outside this plan's scope.
- **Scheduling logic**: SM-2 scheduling stays a small pure function,
  unit-testable independent of both UI and transport/storage.

---

## 6. Explicitly deferred (not v1)

- Real authentication (password, SSO, magic links, verified email
  ownership) — deliberately out of scope, not just not-yet-built; see
  the trade-off called out in Section 5.
- AI-generated card content or explanations — cards should come from the
  user's own retrieval attempts and gaps, not auto-summarized docs.
- Mobile app / native packaging.
- Real-time collaborative decks — export/import (copy deck JSON) is
  sufficient for "sharing a starter deck across separate deployments"
  until there's evidence of actual demand for live collaboration beyond
  what per-user `ReviewState` on one shared deployment already covers.

---

## 7. Open questions for re-planning

None outstanding — all prior open questions have been resolved above.
Revisit this section if new architectural decisions surface during
implementation.

---

## 8. Implementation phases

Ordered so each phase is testable on its own before the next depends on
it. Scheduling logic (Phase 2) and the backend API (Phase 3) are built
and tested independent of the frontend, matching the plan's emphasis on
the scheduler as a pure, UI-independent function. Detailed, checkable
work items live in `docs/CHECKLIST.md`, grouped under these same phases
— tick items off there as each is completed rather than editing this
section.

1. **Repo & tooling scaffolding** — monorepo layout for
   frontend/backend, package manager, linting/formatting, base
   Dockerfiles for both services.
2. **Data & scheduling core** — SQLite schema (Deck, Card, ReviewState
   per Section 3), applied on startup, and the SM-2 scheduling function
   with unit tests (Again/Hard/Good/Easy grading per Section 4).
3. **Backend API** — Express endpoints: due-card pull (interleaved
   across topics per Section 4), submit review grade, deck/card
   CRUD. Talks to SQLite directly (`node:sqlite`) for persistence.
4. **Frontend** — email-entry identity gate, review session flow (show
   front → self-attempt → reveal → grade), add/edit card form, progress
   view (due today, mastered, streak).
5. **Seed content** — author the ~20-30 starter WAF + Landing Zones
   cards and load them via a seed script/migration.
6. **Identity wiring** — email-only identity (`X-User-Email` header,
   stored client-side, no verification); `Deck` ownership and
   `ReviewState` scoped per email per Section 5.
7. **Deployment & networking** — Cloudflare Tunnel in front of the
   homelab app; GitHub Actions workflow in this repo authenticating
   onto Tailscale to deploy; Kubernetes manifests (owned by the user
   per Section 5).
8. **End-to-end verification** — dogfood a full review loop from two
   different devices to confirm cross-device sync actually works
   end-to-end, not just each layer in isolation.
