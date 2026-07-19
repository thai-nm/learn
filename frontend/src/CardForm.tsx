import { useEffect, useState, type FormEvent } from "react";
import { createCard, listDecks } from "./api";
import type { Deck } from "./types";

export function CardForm() {
  const [deck, setDeck] = useState<Deck | null>(null);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [why, setWhy] = useState("");
  const [topic, setTopic] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listDecks()
      .then((decks) => setDeck(decks[0] ?? null))
      .catch((err: Error) => setError(err.message));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!deck) return;
    setStatus("saving");
    setError(null);
    try {
      await createCard({ deckId: deck.id, front, back, why: why || undefined, topic });
      setFront("");
      setBack("");
      setWhy("");
      setTopic("");
      setStatus("saved");
    } catch (err) {
      setError((err as Error).message);
      setStatus("error");
    }
  }

  if (error && !deck) {
    return (
      <div className="panel">
        <p className="error">{error}</p>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="panel">
        <p>Loading deck…</p>
      </div>
    );
  }

  return (
    <div className="panel">
      <p className="topic-tag">Adding to: {deck.title}</p>
      <form className="card-form" onSubmit={handleSubmit}>
        <label>
          Front (question)
          <textarea required value={front} onChange={(e) => setFront(e.target.value)} />
        </label>
        <label>
          Back (answer)
          <textarea required value={back} onChange={(e) => setBack(e.target.value)} />
        </label>
        <label>
          Why it matters (optional)
          <textarea value={why} onChange={(e) => setWhy(e.target.value)} />
        </label>
        <label>
          Topic
          <input required value={topic} onChange={(e) => setTopic(e.target.value)} />
        </label>
        <button type="submit" className="primary" disabled={status === "saving"}>
          Save Card
        </button>
        {status === "saved" && <p className="success">Card saved.</p>}
        {status === "error" && error && <p className="error">{error}</p>}
      </form>
    </div>
  );
}
