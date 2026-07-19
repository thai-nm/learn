import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { SupabaseConfig } from "../config.js";
import { computeDueCards } from "../domain/dueCards.js";
import type {
  CreateCardInput,
  CreateDeckInput,
  Repository,
  UpdateCardInput,
} from "../domain/repository.js";
import type { Card, Deck, DueCard, ReviewState } from "../domain/types.js";

interface DeckRow {
  id: string;
  title: string;
  description: string;
  topics: string[];
  visibility: Deck["visibility"];
}

interface CardRow {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  why: string | null;
  topic: string;
}

interface ReviewStateRow {
  card_id: string;
  user_id: string;
  interval_days: number;
  ease_factor: number;
  next_review_date: string;
  last_reviewed_at: string | null;
  review_count: number;
}

export class SupabaseRepository implements Repository {
  private client: SupabaseClient;

  constructor(config: SupabaseConfig) {
    this.client = createClient(config.url, config.serviceRoleKey, {
      auth: { persistSession: false },
    });
  }

  async listDecks(): Promise<Deck[]> {
    const { data, error } = await this.client.from("decks").select("*");
    if (error) throw error;
    return data.map(deckFromRow);
  }

  async getDeck(deckId: string): Promise<Deck | undefined> {
    const { data, error } = await this.client
      .from("decks")
      .select("*")
      .eq("id", deckId)
      .maybeSingle();
    if (error) throw error;
    return data ? deckFromRow(data) : undefined;
  }

  async createDeck(input: CreateDeckInput): Promise<Deck> {
    const { data, error } = await this.client.from("decks").insert(input).select().single();
    if (error) throw error;
    return deckFromRow(data);
  }

  async listCardsByDeck(deckId: string): Promise<Card[]> {
    const { data, error } = await this.client.from("cards").select("*").eq("deck_id", deckId);
    if (error) throw error;
    return data.map(cardFromRow);
  }

  async getCard(cardId: string): Promise<Card | undefined> {
    const { data, error } = await this.client
      .from("cards")
      .select("*")
      .eq("id", cardId)
      .maybeSingle();
    if (error) throw error;
    return data ? cardFromRow(data) : undefined;
  }

  async createCard(input: CreateCardInput): Promise<Card> {
    const { data, error } = await this.client
      .from("cards")
      .insert({
        deck_id: input.deckId,
        front: input.front,
        back: input.back,
        why: input.why ?? null,
        topic: input.topic,
      })
      .select()
      .single();
    if (error) throw error;
    return cardFromRow(data);
  }

  async updateCard(cardId: string, input: UpdateCardInput): Promise<Card | undefined> {
    const { data, error } = await this.client
      .from("cards")
      .update(input)
      .eq("id", cardId)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data ? cardFromRow(data) : undefined;
  }

  async deleteCard(cardId: string): Promise<boolean> {
    const { data, error } = await this.client.from("cards").delete().eq("id", cardId).select();
    if (error) throw error;
    return data.length > 0;
  }

  async getDueCards(userId: string, now: Date): Promise<DueCard[]> {
    const [{ data: cardRows, error: cardsError }, { data: stateRows, error: statesError }] =
      await Promise.all([
        this.client.from("cards").select("*"),
        this.client.from("review_states").select("*").eq("user_id", userId),
      ]);
    if (cardsError) throw cardsError;
    if (statesError) throw statesError;

    const cards = cardRows.map(cardFromRow);
    const statesByCardId = new Map<string, ReviewState>(
      stateRows.map((row) => [row.card_id, reviewStateFromRow(row)]),
    );

    return computeDueCards(cards, statesByCardId, userId, now);
  }

  async getReviewState(userId: string, cardId: string): Promise<ReviewState | undefined> {
    const { data, error } = await this.client
      .from("review_states")
      .select("*")
      .eq("user_id", userId)
      .eq("card_id", cardId)
      .maybeSingle();
    if (error) throw error;
    return data ? reviewStateFromRow(data) : undefined;
  }

  async upsertReviewState(state: ReviewState): Promise<ReviewState> {
    const { data, error } = await this.client
      .from("review_states")
      .upsert(
        {
          card_id: state.cardId,
          user_id: state.userId,
          interval_days: state.intervalDays,
          ease_factor: state.easeFactor,
          next_review_date: state.nextReviewDate.toISOString(),
          last_reviewed_at: state.lastReviewedAt ? state.lastReviewedAt.toISOString() : null,
          review_count: state.reviewCount,
        },
        { onConflict: "card_id,user_id" },
      )
      .select()
      .single();
    if (error) throw error;
    return reviewStateFromRow(data);
  }
}

function deckFromRow(row: DeckRow): Deck {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    topics: row.topics,
    visibility: row.visibility,
  };
}

function cardFromRow(row: CardRow): Card {
  return {
    id: row.id,
    deckId: row.deck_id,
    front: row.front,
    back: row.back,
    why: row.why ?? undefined,
    topic: row.topic,
  };
}

function reviewStateFromRow(row: ReviewStateRow): ReviewState {
  return {
    cardId: row.card_id,
    userId: row.user_id,
    intervalDays: row.interval_days,
    easeFactor: row.ease_factor,
    nextReviewDate: new Date(row.next_review_date),
    lastReviewedAt: row.last_reviewed_at ? new Date(row.last_reviewed_at) : null,
    reviewCount: row.review_count,
  };
}
