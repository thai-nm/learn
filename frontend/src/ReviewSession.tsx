import { useEffect, useState } from "react";
import { getDueCards, submitReview } from "./api";
import { recordReviewOutcome } from "./masteredTracker";
import type { DueCard, Grade } from "./types";

const GRADES: { grade: Grade; label: string }[] = [
  { grade: "again", label: "Again" },
  { grade: "hard", label: "Hard" },
  { grade: "good", label: "Good" },
  { grade: "easy", label: "Easy" },
];

export function ReviewSession() {
  const [queue, setQueue] = useState<DueCard[] | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [scratch, setScratch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadQueue();
  }, []);

  function loadQueue() {
    setError(null);
    getDueCards()
      .then((due) => {
        setQueue(due);
        setTotalCount(due.length);
      })
      .catch((err: Error) => setError(err.message));
  }

  async function grade(g: Grade) {
    if (!queue || queue.length === 0) return;
    const current = queue[0];
    setSubmitting(true);
    try {
      const reviewState = await submitReview(current.card.id, g);
      recordReviewOutcome(current.card.id, reviewState.intervalDays);
      setQueue(queue.slice(1));
      setRevealed(false);
      setScratch("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (error) {
    return (
      <div className="empty-state">
        <p className="error">{error}</p>
        <button type="button" className="primary" onClick={loadQueue}>
          Retry
        </button>
      </div>
    );
  }

  if (queue === null) {
    return (
      <div className="empty-state">
        <p className="empty-subtext">Loading due cards…</p>
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-dot" />
        <h2 className="empty-heading">You're all caught up</h2>
        <p className="empty-subtext">
          No cards due right now. Check back later, or add a new card.
        </p>
      </div>
    );
  }

  const { card } = queue[0];

  return (
    <div className="review-session">
      <div className="review-meta">
        <span className="topic-tag">{card.topic}</span>
        <span className="progress-label">
          {totalCount - queue.length + 1} of {totalCount}
        </span>
      </div>

      <div className="card-panel">
        <p className="card-front">{card.front}</p>

        {!revealed && (
          <textarea
            className="scratch"
            placeholder="Jot your attempt (optional)"
            value={scratch}
            onChange={(e) => setScratch(e.target.value)}
          />
        )}

        {revealed && (
          <>
            <div className="answer-divider" />
            <p className="section-label">Answer</p>
            <p className="card-back">{card.back}</p>
            {card.why && (
              <div className="why-block">
                <p className="section-label">Why it matters</p>
                <p className="why-text">{card.why}</p>
              </div>
            )}
          </>
        )}
      </div>

      {!revealed && (
        <div className="reveal-row">
          <button type="button" className="primary" onClick={() => setRevealed(true)}>
            Reveal Answer
          </button>
        </div>
      )}

      {revealed && (
        <div className="grade-buttons">
          {GRADES.map(({ grade: g, label }) => (
            <button
              key={g}
              type="button"
              className={`grade grade-${g}`}
              disabled={submitting}
              onClick={() => grade(g)}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
