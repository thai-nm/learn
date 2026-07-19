import { randomUUID } from "node:crypto";
import type {
  CreateCardInput,
  CreateDeckInput,
  Repository,
  UpdateCardInput,
} from "../domain/repository.js";
import type { Card, Deck, DueCard, ReviewState } from "../domain/types.js";

export class InMemoryRepository implements Repository {
  private decks = new Map<string, Deck>();
  private cards = new Map<string, Card>();
  private reviewStates = new Map<string, ReviewState>();

  async listDecks(): Promise<Deck[]> {
    return [...this.decks.values()];
  }

  async getDeck(deckId: string): Promise<Deck | undefined> {
    return this.decks.get(deckId);
  }

  async createDeck(input: CreateDeckInput): Promise<Deck> {
    const deck: Deck = { id: randomUUID(), ...input };
    this.decks.set(deck.id, deck);
    return deck;
  }

  async listCardsByDeck(deckId: string): Promise<Card[]> {
    return [...this.cards.values()].filter((card) => card.deckId === deckId);
  }

  async getCard(cardId: string): Promise<Card | undefined> {
    return this.cards.get(cardId);
  }

  async createCard(input: CreateCardInput): Promise<Card> {
    const card: Card = { id: randomUUID(), ...input };
    this.cards.set(card.id, card);
    return card;
  }

  async updateCard(cardId: string, input: UpdateCardInput): Promise<Card | undefined> {
    const existing = this.cards.get(cardId);
    if (!existing) return undefined;
    const updated: Card = { ...existing, ...input };
    this.cards.set(cardId, updated);
    return updated;
  }

  async deleteCard(cardId: string): Promise<boolean> {
    return this.cards.delete(cardId);
  }

  async getDueCards(userId: string, now: Date): Promise<DueCard[]> {
    const dueByTopic = new Map<string, DueCard[]>();

    for (const card of this.cards.values()) {
      const state =
        this.reviewStates.get(reviewKey(userId, card.id)) ?? freshReviewState(userId, card.id);
      if (state.nextReviewDate.getTime() > now.getTime()) continue;

      const bucket = dueByTopic.get(card.topic) ?? [];
      bucket.push({ card, reviewState: state });
      dueByTopic.set(card.topic, bucket);
    }

    return interleave([...dueByTopic.values()]);
  }

  async getReviewState(userId: string, cardId: string): Promise<ReviewState | undefined> {
    return this.reviewStates.get(reviewKey(userId, cardId));
  }

  async upsertReviewState(state: ReviewState): Promise<ReviewState> {
    this.reviewStates.set(reviewKey(state.userId, state.cardId), state);
    return state;
  }
}

function reviewKey(userId: string, cardId: string): string {
  return `${userId}:${cardId}`;
}

function freshReviewState(userId: string, cardId: string): ReviewState {
  return {
    cardId,
    userId,
    intervalDays: 0,
    easeFactor: 2.5,
    nextReviewDate: new Date(0),
    lastReviewedAt: null,
    reviewCount: 0,
  };
}

/** Round-robins across topic buckets so due cards interleave rather than group by topic. */
function interleave(buckets: DueCard[][]): DueCard[] {
  const result: DueCard[] = [];
  let remaining = buckets.map((bucket) => [...bucket]);

  while (remaining.some((bucket) => bucket.length > 0)) {
    for (const bucket of remaining) {
      const next = bucket.shift();
      if (next) result.push(next);
    }
    remaining = remaining.filter((bucket) => bucket.length > 0);
  }

  return result;
}
