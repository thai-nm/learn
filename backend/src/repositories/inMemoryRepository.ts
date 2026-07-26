import { randomUUID } from "node:crypto";
import { canReadDeck } from "../domain/access.js";
import { computeDueCards } from "../domain/dueCards.js";
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

  async listDecks(userEmail: string): Promise<Deck[]> {
    return [...this.decks.values()].filter((deck) => canReadDeck(deck, userEmail));
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
    const accessibleDeckIds = new Set(
      [...this.decks.values()].filter((deck) => canReadDeck(deck, userId)).map((deck) => deck.id),
    );
    const cards = [...this.cards.values()].filter((card) => accessibleDeckIds.has(card.deckId));

    const statesByCardId = new Map<string, ReviewState>();
    for (const card of cards) {
      const state = this.reviewStates.get(reviewKey(userId, card.id));
      if (state) statesByCardId.set(card.id, state);
    }
    return computeDueCards(cards, statesByCardId, userId, now);
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
