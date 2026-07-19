# WAF / Landing Zones Spaced-Repetition Learning App — Plan

## 1. Purpose

A personal learning tool to study the Azure Well-Architected Framework (WAF)
and Azure Landing Zones, built around evidence-based learning methods rather
than a static quiz or notes app. Starts as a single-user tool; data model
should support sharing/publishing a starter deck to other DevOps/Cloud
practitioners later without a rewrite. Cross-device access (studying from
more than one computer) is a real v1 requirement, met via a self-hosted
backend rather than browser-only storage.

**Non-goal for v1:** user-facing accounts/signup/login UI, multi-user
sync, AI-generated card content. Data lives in a personal backend under a
single fixed identity (no login screen) rather than in the browser — that's
a storage decision, not multi-user support. Keep v1 lean; these are
explicitly deferred (see Section 6).

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
  - title
  - description
  - topics: [ ]          // e.g. Reliability, Operational Excellence, Landing Zones
  - visibility: personal | shared

Card (belongs to a Deck)
  - id
  - deck_id
  - front (question)
  - back (answer)
  - why (optional — self-explanation / rationale field)
  - topic/pillar tag

ReviewState (per user, per card — separate structure from Card)
  - card_id
  - user_id (stub field for now; single implicit user in v1)
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
- **Backend**: a lightweight Node API (Fastify — popular, simple,
  minimal ceremony) holding the SM-2 scheduling/review-session logic in
  front of the database. Frontend and backend both deploy as containers
  in the user's homelab.
- **Database/Auth**: hosted Supabase cloud project (managed Postgres +
  Auth). Only the app containers run in the homelab; the DB itself is
  Supabase-managed, so there's no DB to operate/back up locally. A
  single fixed Supabase Auth account is used for v1 — no signup/login
  UI is built, but real multi-user auth is already available
  underneath if it's ever needed, without a data-layer migration.
- **Networking**: the homelab app is exposed via Cloudflare Tunnel,
  gated by Cloudflare Access (no unauthenticated app-level surface).
- **CI/CD**: GitHub Actions workflows live in this repo, authenticating
  onto the Tailscale network via OAuth client credentials stored as
  repo secrets to reach the homelab and deploy.
- **Orchestration**: the homelab runs Kubernetes. Deployment manifests/
  setup are owned by the user directly, outside this plan's scope.
- **Scheduling logic**: SM-2 scheduling stays a small pure function,
  unit-testable independent of both UI and transport/storage.

---

## 6. Explicitly deferred (not v1)

- User-facing accounts / signup / login UI / multi-user sync. (Data
  living in a personal self-hosted backend rather than the browser is a
  storage decision, not multi-user support — see Section 5.)
- AI-generated card content or explanations — cards should come from the
  user's own retrieval attempts and gaps, not auto-summarized docs.
- Mobile app / native packaging.
- Real-time collaborative decks — export/import (copy deck JSON) is
  sufficient for "sharing" until there's evidence of actual demand for
  live collaboration.

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
2. **Data & scheduling core** — Supabase project + schema (Deck, Card,
   ReviewState per Section 3), migrations, and the SM-2 scheduling
   function with unit tests (Again/Hard/Good/Easy grading per Section
   4).
3. **Backend API** — Fastify endpoints: due-card pull (interleaved
   across topics per Section 4), submit review grade, deck/card
   CRUD. Talks to Supabase for persistence.
4. **Frontend** — review session flow (show front → self-attempt →
   reveal → grade), add/edit card form, progress view (due today,
   mastered, streak).
5. **Seed content** — author the ~20-30 starter WAF + Landing Zones
   cards and load them via a seed script/migration.
6. **Auth & identity wiring** — single fixed Supabase Auth account
   used by both frontend and backend; no signup/login UI built.
7. **Deployment & networking** — Cloudflare Tunnel + Access in front of
   the homelab app; GitHub Actions workflow in this repo authenticating
   onto Tailscale to deploy; Kubernetes manifests (owned by the user
   per Section 5).
8. **End-to-end verification** — dogfood a full review loop from two
   different devices to confirm cross-device sync actually works
   end-to-end, not just each layer in isolation.
