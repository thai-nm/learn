import { useEffect, useRef, useState, type FormEvent } from "react";
import { createCard, listDecks } from "./api";
import type { Deck } from "./types";

export function CardForm() {
  const [deck, setDeck] = useState<Deck | null>(null);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [why, setWhy] = useState("");
  const [topic, setTopic] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    listDecks()
      .then((decks) => setDeck(decks[0] ?? null))
      .catch((err: Error) => setError(err.message));
    return () => clearTimeout(toastTimer.current);
  }, []);

  const addDisabled = status === "saving" || !(front.trim() && back.trim() && topic.trim());

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!deck || addDisabled) return;
    setStatus("saving");
    setError(null);
    try {
      await createCard({ deckId: deck.id, front, back, why: why || undefined, topic });
      setFront("");
      setBack("");
      setWhy("");
      setTopic("");
      setStatus("idle");
      setShowToast(true);
      clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setShowToast(false), 2200);
    } catch (err) {
      setError((err as Error).message);
      setStatus("error");
    }
  }

  if (error && !deck) {
    return (
      <div className="empty-state">
        <p className="error">{error}</p>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="empty-state">
        <p className="empty-subtext">Loading deck…</p>
      </div>
    );
  }

  return (
    <div className="add-card-view">
      <h2 className="view-heading">Add a card</h2>
      <p className="view-subtitle">From something you actually got wrong or wondered about.</p>

      <form className="card-form" onSubmit={handleSubmit}>
        <div>
          <div className="field-label">Topic</div>
          <input
            required
            placeholder="e.g. Reliability, Landing Zones"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </div>
        <div>
          <div className="field-label">Front — question</div>
          <textarea
            required
            placeholder="What are you asking yourself?"
            value={front}
            onChange={(e) => setFront(e.target.value)}
          />
        </div>
        <div>
          <div className="field-label">Back — answer</div>
          <textarea
            required
            placeholder="The answer"
            value={back}
            onChange={(e) => setBack(e.target.value)}
          />
        </div>
        <div>
          <div className="field-label">
            Why it matters <span className="optional">(optional)</span>
          </div>
          <textarea
            placeholder="The context that makes it stick"
            value={why}
            onChange={(e) => setWhy(e.target.value)}
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="primary" disabled={addDisabled}>
            Add card
          </button>
          {showToast && <span className="toast">Card added.</span>}
          {status === "error" && error && <span className="error">{error}</span>}
        </div>
      </form>
    </div>
  );
}
