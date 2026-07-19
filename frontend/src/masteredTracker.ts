// Best-effort "mastered" tracking, kept client-side. The backend has no
// endpoint that returns review state for every card (only due cards), so
// there's no way to derive a true mastered count for cards this browser
// hasn't reviewed yet. This records the interval seen after each grade
// submitted from this browser, which is a reasonable approximation
// without adding a new backend endpoint.
const STORAGE_KEY = "waf-study.review-intervals";
const MASTERED_THRESHOLD_DAYS = 21;

function readIntervals(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function recordReviewOutcome(cardId: string, intervalDays: number) {
  const intervals = readIntervals();
  intervals[cardId] = intervalDays;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(intervals));
}

export function getMasteredCount(): number {
  return Object.values(readIntervals()).filter((days) => days >= MASTERED_THRESHOLD_DAYS).length;
}

export function getReviewedCount(): number {
  return Object.keys(readIntervals()).length;
}
