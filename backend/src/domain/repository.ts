import type { Card, Deck, DueCard, ReviewState } from "./types.js";

export interface CreateDeckInput {
  title: string;
  description: string;
  topics: string[];
  visibility: Deck["visibility"];
}

export interface CreateCardInput {
  deckId: string;
  front: string;
  back: string;
  why?: string;
  topic: string;
}

export interface UpdateCardInput {
  front?: string;
  back?: string;
  why?: string;
  topic?: string;
}

/**
 * Storage-agnostic contract the API layer depends on. Implementations
 * (in-memory now, Supabase-backed later) are swappable without touching
 * routes, matching the Deck/Card/ReviewState split in docs/PLAN.md
 * Section 3.
 */
export interface Repository {
  listDecks(): Promise<Deck[]>;
  getDeck(deckId: string): Promise<Deck | undefined>;
  createDeck(input: CreateDeckInput): Promise<Deck>;

  listCardsByDeck(deckId: string): Promise<Card[]>;
  getCard(cardId: string): Promise<Card | undefined>;
  createCard(input: CreateCardInput): Promise<Card>;
  updateCard(cardId: string, input: UpdateCardInput): Promise<Card | undefined>;
  deleteCard(cardId: string): Promise<boolean>;

  /** Cards due for the given user at `now`, interleaved across topics. */
  getDueCards(userId: string, now: Date): Promise<DueCard[]>;
  getReviewState(userId: string, cardId: string): Promise<ReviewState | undefined>;
  upsertReviewState(state: ReviewState): Promise<ReviewState>;
}
