import type { Card, Deck, DueCard, Grade, ReviewState } from "./types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function listDecks(): Promise<Deck[]> {
  return request("/decks");
}

export function listCardsByDeck(deckId: string): Promise<Card[]> {
  return request(`/decks/${deckId}/cards`);
}

export function getDueCards(): Promise<DueCard[]> {
  return request("/reviews/due");
}

export function submitReview(cardId: string, grade: Grade): Promise<ReviewState> {
  return request(`/reviews/${cardId}`, { method: "POST", body: JSON.stringify({ grade }) });
}

export interface CreateCardInput {
  deckId: string;
  front: string;
  back: string;
  why?: string;
  topic: string;
}

export function createCard(input: CreateCardInput): Promise<Card> {
  return request("/cards", { method: "POST", body: JSON.stringify(input) });
}

export interface UpdateCardInput {
  front?: string;
  back?: string;
  why?: string;
  topic?: string;
}

export function updateCard(cardId: string, input: UpdateCardInput): Promise<Card> {
  return request(`/cards/${cardId}`, { method: "PATCH", body: JSON.stringify(input) });
}

export function deleteCard(cardId: string): Promise<void> {
  return request(`/cards/${cardId}`, { method: "DELETE" });
}
