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
        const cardLists = await Promise.all(decks.map((deck) => listCardsByDeck(deck.id)));
        setTotalCards(cardLists.reduce((sum, cards) => sum + cards.length, 0));
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  if (error) {
    return (
      <div className="empty-state">
        <p className="error">{error}</p>
      </div>
    );
  }

  return (
    <div className="progress-view">
      <h2 className="view-heading">A quiet look at your deck</h2>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{dueCount ?? "…"}</div>
          <div className="stat-label">Due today</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totalCards ?? "…"}</div>
          <div className="stat-label">Total cards</div>
        </div>
        <div className="stat-card">
          <div className="stat-value accent">{getMasteredCount()}</div>
          <div className="stat-label">Mastered</div>
        </div>
      </div>

      <p className="note">
        Mastered count only reflects cards reviewed from this browser ({getReviewedCount()} reviewed
        so far) — the backend doesn't yet expose review state for cards that aren't currently due,
        so a fully accurate mastered count isn't possible without a new endpoint.
      </p>
    </div>
  );
}
