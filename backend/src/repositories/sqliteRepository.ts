import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { SqliteConfig } from "../config.js";
import { migrate } from "../db/schema.js";
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
  owner_email: string;
  title: string;
  description: string;
  topics: string;
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

export class SqliteRepository implements Repository {
  private db: DatabaseSync;

  constructor(config: SqliteConfig) {
    if (config.path !== ":memory:") mkdirSync(dirname(config.path), { recursive: true });
    this.db = new DatabaseSync(config.path);
    migrate(this.db);
  }

  async listDecks(userEmail: string): Promise<Deck[]> {
    const rows = this.db
      .prepare("select * from decks where owner_email = ? or visibility = 'shared'")
      .all(userEmail) as unknown as DeckRow[];
    return rows.map(deckFromRow);
  }

  async getDeck(deckId: string): Promise<Deck | undefined> {
    const row = this.db.prepare("select * from decks where id = ?").get(deckId) as unknown as
      DeckRow | undefined;
    return row ? deckFromRow(row) : undefined;
  }

  async createDeck(input: CreateDeckInput): Promise<Deck> {
    const row = this.db
      .prepare(
        `insert into decks (id, owner_email, title, description, topics, visibility)
         values (?, ?, ?, ?, ?, ?) returning *`,
      )
      .get(
        randomUUID(),
        input.ownerEmail,
        input.title,
        input.description,
        JSON.stringify(input.topics),
        input.visibility,
      ) as unknown as DeckRow;
    return deckFromRow(row);
  }

  async listCardsByDeck(deckId: string): Promise<Card[]> {
    const rows = this.db
      .prepare("select * from cards where deck_id = ?")
      .all(deckId) as unknown as CardRow[];
    return rows.map(cardFromRow);
  }

  async getCard(cardId: string): Promise<Card | undefined> {
    const row = this.db.prepare("select * from cards where id = ?").get(cardId) as unknown as
      CardRow | undefined;
    return row ? cardFromRow(row) : undefined;
  }

  async createCard(input: CreateCardInput): Promise<Card> {
    const row = this.db
      .prepare(
        `insert into cards (id, deck_id, front, back, why, topic)
         values (?, ?, ?, ?, ?, ?) returning *`,
      )
      .get(
        randomUUID(),
        input.deckId,
        input.front,
        input.back,
        input.why ?? null,
        input.topic,
      ) as unknown as CardRow;
    return cardFromRow(row);
  }

  async updateCard(cardId: string, input: UpdateCardInput): Promise<Card | undefined> {
    const fields = Object.entries(input).filter(([, value]) => value !== undefined);
    if (fields.length === 0) return this.getCard(cardId);

    const setClause = fields.map(([key]) => `${key} = ?`).join(", ");
    const values = fields.map(([, value]) => value);

    const row = this.db
      .prepare(`update cards set ${setClause} where id = ? returning *`)
      .get(...values, cardId) as unknown as CardRow | undefined;
    return row ? cardFromRow(row) : undefined;
  }

  async deleteCard(cardId: string): Promise<boolean> {
    const { changes } = this.db.prepare("delete from cards where id = ?").run(cardId);
    return Number(changes) > 0;
  }

  async getDueCards(userId: string, now: Date): Promise<DueCard[]> {
    const cardRows = this.db
      .prepare(
        `select cards.* from cards
         join decks on decks.id = cards.deck_id
         where decks.owner_email = ? or decks.visibility = 'shared'`,
      )
      .all(userId) as unknown as CardRow[];
    const stateRows = this.db
      .prepare("select * from review_states where user_id = ?")
      .all(userId) as unknown as ReviewStateRow[];

    const cards = cardRows.map(cardFromRow);
    const statesByCardId = new Map<string, ReviewState>(
      stateRows.map((row) => [row.card_id, reviewStateFromRow(row)]),
    );

    return computeDueCards(cards, statesByCardId, userId, now);
  }

  async getReviewState(userId: string, cardId: string): Promise<ReviewState | undefined> {
    const row = this.db
      .prepare("select * from review_states where user_id = ? and card_id = ?")
      .get(userId, cardId) as unknown as ReviewStateRow | undefined;
    return row ? reviewStateFromRow(row) : undefined;
  }

  async upsertReviewState(state: ReviewState): Promise<ReviewState> {
    const row = this.db
      .prepare(
        `insert into review_states
           (card_id, user_id, interval_days, ease_factor, next_review_date, last_reviewed_at, review_count)
         values (?, ?, ?, ?, ?, ?, ?)
         on conflict (card_id, user_id) do update set
           interval_days = excluded.interval_days,
           ease_factor = excluded.ease_factor,
           next_review_date = excluded.next_review_date,
           last_reviewed_at = excluded.last_reviewed_at,
           review_count = excluded.review_count
         returning *`,
      )
      .get(
        state.cardId,
        state.userId,
        state.intervalDays,
        state.easeFactor,
        state.nextReviewDate.toISOString(),
        state.lastReviewedAt ? state.lastReviewedAt.toISOString() : null,
        state.reviewCount,
      ) as unknown as ReviewStateRow;
    return reviewStateFromRow(row);
  }
}

function deckFromRow(row: DeckRow): Deck {
  return {
    id: row.id,
    ownerEmail: row.owner_email,
    title: row.title,
    description: row.description,
    topics: JSON.parse(row.topics) as string[],
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
