import { useEffect, useState } from "react";
import { getDueCards, listCardsByDeck, listDecks } from "./api";
import { getMasteredCount, getReviewedCount } from "./masteredTracker";

export function Progress() {
  const [dueCount, setDueCount] = useState<number | null>(null);
  const [totalCards, setTotalCards] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getDueCards(), listDecks()])
      .then(async ([due, decks]) => {
        setDueCount(due.length);
        const deck = decks[0];
        if (deck) {
          const cards = await listCardsByDeck(deck.id);
          setTotalCards(cards.length);
        }
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  if (error) {
    return (
      <div className="panel">
        <p className="error">{error}</p>
      </div>
    );
  }

  return (
    <div className="panel progress">
      <div className="stat">
        <span className="stat-value">{dueCount ?? "…"}</span>
        <span className="stat-label">Due today</span>
      </div>
      <div className="stat">
        <span className="stat-value">{getMasteredCount()}</span>
        <span className="stat-label">Mastered (interval ≥ 21 days)</span>
      </div>
      <div className="stat">
        <span className="stat-value">{totalCards ?? "…"}</span>
        <span className="stat-label">Total cards in deck</span>
      </div>
      <p className="note">
        Mastered count only reflects cards reviewed from this browser ({getReviewedCount()} reviewed
        so far) — the backend doesn't yet expose review state for cards that aren't currently due,
        so a fully accurate mastered count isn't possible without a new endpoint.
      </p>
    </div>
  );
}
