# Design Brief: WAF & Landing Zones Study App

## What this is

A personal spaced-repetition flashcard app for studying the Azure
Well-Architected Framework (WAF) and Azure Landing Zones. Single user,
used daily as a study habit — not a product with signup/marketing
surfaces, just the working app itself.

## Design direction

**Minimal, clean, focus-mode.** Distraction-free and calm — closer to a
well-designed reading or writing app than a dashboard. Generous
whitespace, quiet typography, low visual noise. The goal is to support
a daily habit without friction or clutter: open it, review a few cards,
leave. Nothing should compete for attention with the card content
itself during a review.

## Why the UX has specific hard requirements (not just aesthetic)

This app is built around evidence-based learning principles, and a few
of them directly constrain the design — these aren't stylistic
preferences, they're functional requirements:

- **Testing effect**: the answer must never be visible before the user
  has attempted to recall it. The front of the card is shown alone;
  revealing the back requires a deliberate action (not a hover, not
  auto-reveal after a timer).
- **Desirable difficulty**: don't design for the user to *feel* good in
  the moment (e.g. don't make grading feel like a reward/punishment
  system with heavy gamification). Optimize for a calm, low-pressure
  self-assessment, not dopamine-driven streaks.
- **Interleaving**: cards from different topics/pillars appear mixed
  together in one queue, not grouped or tabbed by topic. The UI
  shouldn't visually imply topic-blocking (e.g. no topic-based
  progress bars segmented by pillar).
- **Self-explanation**: an optional "why does this matter" note is
  part of each card and should have a clear but secondary visual role
  — supporting the answer, not competing with it.

## Screens to design

### 1. Review session (the primary, most-used screen)
- Shows one card at a time: topic tag, question ("front").
- An optional scratch space for the user to jot their attempt before
  revealing (nice-to-have, not critical).
- A clear, deliberate "Reveal Answer" action.
- After reveal: the answer ("back"), and the optional "why it matters"
  note.
- Four grading actions: **Again / Hard / Good / Easy** (this is the
  Anki-style self-grading scale — needs to be fast to tap/click since
  it's used dozens of times per session, but shouldn't dominate the
  screen visually before reveal).
- A lightweight sense of progress through today's queue (e.g. "12 of
  26" or similar) — informational, not a gamified progress bar.
- Empty state: "no cards due right now" (calm, positive, not an error).

### 2. Add card
- A simple form: front (question), back (answer), why it matters
  (optional), topic tag.
- This is used deliberately and infrequently (the user adds cards from
  their own real-world learning gaps, not in bulk) — doesn't need to be
  optimized for speed/volume entry.

### 3. Progress
- Cards due today (count).
- Total cards in the deck.
- A "mastered" count (cards with a long review interval — currently
  tracked client-side, may be revisited).
- Should feel like a quiet status check, not a stats dashboard —
  resist the urge to add charts/graphs for a 3-number view.

## Navigation

Three views total (Review / Add Card / Progress). Currently simple tab
navigation — open to a better pattern (e.g. a minimal sidebar, a
top bar) as long as it stays out of the way during a review session,
since that's the screen used 95% of the time.

## Current implementation state (what exists today, to be redesigned)

The app is functionally complete but visually undifferentiated — plain
panels, default form controls, no real typography or color system, no
transitions/feedback beyond text state changes. It works correctly; it
just looks like unstyled scaffolding. Nothing about the current visual
design needs to be preserved.

## Technical constraints for whatever design is produced

- React + TypeScript SPA (Vite), no CSS framework currently in use —
  open to adding one, but keep the dependency footprint reasonable for
  a small personal app.
- Must support both light and dark viewing (no strong preference on
  which is default).
- No accounts/login UI — there's only ever one user, so no
  profile/avatar/settings-for-multiple-people affordances are needed.
- Should work well at both desktop and mobile widths (studying from a
  phone is a real use case).
