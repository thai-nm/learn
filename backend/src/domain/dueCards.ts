import { DEFAULT_EASE_FACTOR } from "../scheduling/sm2.js";
import type { Card, DueCard, ReviewState } from "./types.js";

export function freshReviewState(userId: string, cardId: string): ReviewState {
  return {
    cardId,
    userId,
    intervalDays: 0,
    easeFactor: DEFAULT_EASE_FACTOR,
    nextReviewDate: new Date(0),
    lastReviewedAt: null,
    reviewCount: 0,
  };
}

/**
 * Buckets cards by topic and picks the ones due at `now` (falling back to
 * a never-reviewed default so brand-new cards are immediately due), then
 * round-robins across topic buckets so results interleave rather than
 * group by topic (docs/PLAN.md Section 2 — interleaving).
 */
export function computeDueCards(
  cards: Card[],
  reviewStatesByCardId: Map<string, ReviewState>,
  userId: string,
  now: Date,
): DueCard[] {
  const dueByTopic = new Map<string, DueCard[]>();

  for (const card of cards) {
    const state = reviewStatesByCardId.get(card.id) ?? freshReviewState(userId, card.id);
    if (state.nextReviewDate.getTime() > now.getTime()) continue;

    const bucket = dueByTopic.get(card.topic) ?? [];
    bucket.push({ card, reviewState: state });
    dueByTopic.set(card.topic, bucket);
  }

  return interleave([...dueByTopic.values()]);
}

function interleave(buckets: DueCard[][]): DueCard[] {
  const result: DueCard[] = [];
  let remaining = buckets.map((bucket) => [...bucket]);

  while (remaining.some((bucket) => bucket.length > 0)) {
    for (const bucket of remaining) {
      const next = bucket.shift();
      if (next) result.push(next);
    }
    remaining = remaining.filter((bucket) => bucket.length > 0);
  }

  return result;
}
