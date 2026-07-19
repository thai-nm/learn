import { describe, expect, it } from "vitest";
import { scheduleNextReview, type ReviewState } from "./sm2.js";

const freshCard: ReviewState = { intervalDays: 0, easeFactor: 2.5, reviewCount: 0 };
const now = new Date("2026-07-19T00:00:00Z");

describe("scheduleNextReview", () => {
  it("schedules a new card's first successful review 1 day out", () => {
    const result = scheduleNextReview(freshCard, "good", now);
    expect(result.intervalDays).toBe(1);
    expect(result.reviewCount).toBe(1);
    expect(result.nextReviewDate.toISOString()).toBe("2026-07-20T00:00:00.000Z");
  });

  it("schedules the second successful review 6 days out regardless of grade", () => {
    const afterFirst = scheduleNextReview(freshCard, "good", now);
    const afterSecond = scheduleNextReview(afterFirst, "good", now);
    expect(afterSecond.intervalDays).toBe(6);
    expect(afterSecond.reviewCount).toBe(2);
  });

  it("grows the interval by the ease factor on repeated Good grades", () => {
    let state = scheduleNextReview(freshCard, "good", now); // review 1: 1 day
    state = scheduleNextReview(state, "good", now); // review 2: 6 days
    state = scheduleNextReview(state, "good", now); // review 3: 6 * 2.5 = 15
    expect(state.intervalDays).toBe(15);
    expect(state.easeFactor).toBe(2.5);
  });

  it("applies an easy bonus multiplier and increases the ease factor", () => {
    let state = scheduleNextReview(freshCard, "good", now);
    state = scheduleNextReview(state, "good", now);
    const before = state.easeFactor;
    state = scheduleNextReview(state, "easy", now);
    expect(state.intervalDays).toBe(Math.round(6 * before * 1.3));
    expect(state.easeFactor).toBeCloseTo(before + 0.15);
  });

  it("uses a smaller fixed multiplier and decreases ease factor on Hard", () => {
    let state = scheduleNextReview(freshCard, "good", now);
    state = scheduleNextReview(state, "good", now);
    const before = state.easeFactor;
    state = scheduleNextReview(state, "hard", now);
    expect(state.intervalDays).toBe(Math.round(6 * 1.2));
    expect(state.easeFactor).toBeCloseTo(before - 0.15);
  });

  it("resets interval and review count on Again without fully resetting ease factor", () => {
    let state = scheduleNextReview(freshCard, "good", now);
    state = scheduleNextReview(state, "good", now);
    state = scheduleNextReview(state, "good", now); // interval 15, ease 2.5
    const before = state.easeFactor;
    state = scheduleNextReview(state, "again", now);
    expect(state.intervalDays).toBe(1);
    expect(state.reviewCount).toBe(0);
    expect(state.easeFactor).toBeCloseTo(before - 0.2);
  });

  it("never lets the ease factor drop below the 1.3 floor", () => {
    let state: ReviewState = freshCard;
    for (let i = 0; i < 20; i++) {
      state = scheduleNextReview(state, "again", now);
    }
    expect(state.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it("defaults to the standard ease factor when none is provided", () => {
    const result = scheduleNextReview(
      { intervalDays: 0, easeFactor: 0, reviewCount: 0 },
      "hard",
      now,
    );
    expect(result.easeFactor).toBeCloseTo(2.5 - 0.15);
  });
});
