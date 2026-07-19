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
      .then(setQueue)
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
      <div className="panel">
        <p className="error">{error}</p>
        <button type="button" onClick={loadQueue}>
          Retry
        </button>
      </div>
    );
  }

  if (queue === null) {
    return (
      <div className="panel">
        <p>Loading due cards…</p>
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <div className="panel">
        <p>No cards due right now. Check back later, or add a new card.</p>
      </div>
    );
  }

  const { card } = queue[0];

  return (
    <div className="panel review-session">
      <p className="topic-tag">{card.topic}</p>
      <p className="due-count">{queue.length} card(s) due</p>
      <div className="card-face">
        <h2>{card.front}</h2>
      </div>

      {!revealed && (
        <>
          <textarea
            className="scratch"
            placeholder="Jot down your attempt before revealing the answer (optional)"
            value={scratch}
            onChange={(e) => setScratch(e.target.value)}
          />
          <button type="button" className="primary" onClick={() => setRevealed(true)}>
            Reveal Answer
          </button>
        </>
      )}

      {revealed && (
        <>
          <div className="card-face answer">
            <p>{card.back}</p>
            {card.why && <p className="why">Why it matters: {card.why}</p>}
          </div>
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
        </>
      )}
    </div>
  );
}
