export type Grade = "again" | "hard" | "good" | "easy";

export interface ReviewState {
  intervalDays: number;
  easeFactor: number;
  reviewCount: number;
}

export interface ReviewResult extends ReviewState {
  nextReviewDate: Date;
  lastReviewedAt: Date;
}

const DEFAULT_EASE_FACTOR = 2.5;
const MIN_EASE_FACTOR = 1.3;
const AGAIN_EASE_PENALTY = 0.2;
const HARD_EASE_PENALTY = 0.15;
const EASY_EASE_BONUS = 0.15;
const HARD_MULTIPLIER = 1.2;
const EASY_BONUS_MULTIPLIER = 1.3;

/**
 * SM-2-style scheduler (Anki-family). First two successful reviews use
 * fixed steps (1 day, then 6 days); afterward the interval scales by the
 * ease factor. A failed ("again") review resets the interval/review
 * count without fully resetting the ease factor, matching Anki's lapse
 * behavior.
 */
export function scheduleNextReview(
  state: ReviewState,
  grade: Grade,
  now: Date = new Date(),
): ReviewResult {
  const easeFactor = state.easeFactor || DEFAULT_EASE_FACTOR;

  if (grade === "again") {
    return {
      intervalDays: 1,
      easeFactor: Math.max(MIN_EASE_FACTOR, easeFactor - AGAIN_EASE_PENALTY),
      reviewCount: 0,
      nextReviewDate: addDays(now, 1),
      lastReviewedAt: now,
    };
  }

  const reviewCount = state.reviewCount + 1;
  let intervalDays: number;

  if (reviewCount === 1) {
    intervalDays = 1;
  } else if (reviewCount === 2) {
    intervalDays = 6;
  } else {
    const multiplier =
      grade === "hard"
        ? HARD_MULTIPLIER
        : grade === "easy"
          ? easeFactor * EASY_BONUS_MULTIPLIER
          : easeFactor;
    intervalDays = Math.round(state.intervalDays * multiplier);
  }

  const easeDelta = grade === "hard" ? -HARD_EASE_PENALTY : grade === "easy" ? EASY_EASE_BONUS : 0;
  const newEaseFactor = Math.max(MIN_EASE_FACTOR, easeFactor + easeDelta);

  return {
    intervalDays,
    easeFactor: newEaseFactor,
    reviewCount,
    nextReviewDate: addDays(now, intervalDays),
    lastReviewedAt: now,
  };
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
