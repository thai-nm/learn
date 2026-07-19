import { Pool, types } from "pg";
import type { PostgresConfig } from "../config.js";
import { computeDueCards } from "../domain/dueCards.js";
import type {
  CreateCardInput,
  CreateDeckInput,
  Repository,
  UpdateCardInput,
} from "../domain/repository.js";
import type { Card, Deck, DueCard, ReviewState } from "../domain/types.js";

// pg returns `numeric` columns (ease_factor) as strings by default to
// avoid float precision loss on values pg can't infer safe range for;
// the scheduler does plain arithmetic on it, so parse it as a number.
const NUMERIC_OID = 1700;
types.setTypeParser(NUMERIC_OID, parseFloat);

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
  next_review_date: Date;
  last_reviewed_at: Date | null;
  review_count: number;
}

export class PostgresRepository implements Repository {
  private pool: Pool;

  constructor(config: PostgresConfig) {
    this.pool = new Pool({ connectionString: config.connectionString });
  }

  async listDecks(): Promise<Deck[]> {
    const { rows } = await this.pool.query<DeckRow>("select * from decks");
    return rows.map(deckFromRow);
  }

  async getDeck(deckId: string): Promise<Deck | undefined> {
    const { rows } = await this.pool.query<DeckRow>("select * from decks where id = $1", [deckId]);
    return rows[0] ? deckFromRow(rows[0]) : undefined;
  }

  async createDeck(input: CreateDeckInput): Promise<Deck> {
    const { rows } = await this.pool.query<DeckRow>(
      `insert into decks (title, description, topics, visibility)
       values ($1, $2, $3, $4) returning *`,
      [input.title, input.description, input.topics, input.visibility],
    );
    return deckFromRow(rows[0]);
  }

  async listCardsByDeck(deckId: string): Promise<Card[]> {
    const { rows } = await this.pool.query<CardRow>("select * from cards where deck_id = $1", [
      deckId,
    ]);
    return rows.map(cardFromRow);
  }

  async getCard(cardId: string): Promise<Card | undefined> {
    const { rows } = await this.pool.query<CardRow>("select * from cards where id = $1", [cardId]);
    return rows[0] ? cardFromRow(rows[0]) : undefined;
  }

  async createCard(input: CreateCardInput): Promise<Card> {
    const { rows } = await this.pool.query<CardRow>(
      `insert into cards (deck_id, front, back, why, topic)
       values ($1, $2, $3, $4, $5) returning *`,
      [input.deckId, input.front, input.back, input.why ?? null, input.topic],
    );
    return cardFromRow(rows[0]);
  }

  async updateCard(cardId: string, input: UpdateCardInput): Promise<Card | undefined> {
    const fields = Object.entries(input).filter(([, value]) => value !== undefined);
    if (fields.length === 0) return this.getCard(cardId);

    const setClause = fields.map(([key], i) => `${key} = $${i + 2}`).join(", ");
    const values = fields.map(([, value]) => value);

    const { rows } = await this.pool.query<CardRow>(
      `update cards set ${setClause} where id = $1 returning *`,
      [cardId, ...values],
    );
    return rows[0] ? cardFromRow(rows[0]) : undefined;
  }

  async deleteCard(cardId: string): Promise<boolean> {
    const { rowCount } = await this.pool.query("delete from cards where id = $1", [cardId]);
    return (rowCount ?? 0) > 0;
  }

  async getDueCards(userId: string, now: Date): Promise<DueCard[]> {
    const [cardsResult, statesResult] = await Promise.all([
      this.pool.query<CardRow>("select * from cards"),
      this.pool.query<ReviewStateRow>("select * from review_states where user_id = $1", [userId]),
    ]);

    const cards = cardsResult.rows.map(cardFromRow);
    const statesByCardId = new Map<string, ReviewState>(
      statesResult.rows.map((row) => [row.card_id, reviewStateFromRow(row)]),
    );

    return computeDueCards(cards, statesByCardId, userId, now);
  }

  async getReviewState(userId: string, cardId: string): Promise<ReviewState | undefined> {
    const { rows } = await this.pool.query<ReviewStateRow>(
      "select * from review_states where user_id = $1 and card_id = $2",
      [userId, cardId],
    );
    return rows[0] ? reviewStateFromRow(rows[0]) : undefined;
  }

  async upsertReviewState(state: ReviewState): Promise<ReviewState> {
    const { rows } = await this.pool.query<ReviewStateRow>(
      `insert into review_states
         (card_id, user_id, interval_days, ease_factor, next_review_date, last_reviewed_at, review_count)
       values ($1, $2, $3, $4, $5, $6, $7)
       on conflict (card_id, user_id) do update set
         interval_days = excluded.interval_days,
         ease_factor = excluded.ease_factor,
         next_review_date = excluded.next_review_date,
         last_reviewed_at = excluded.last_reviewed_at,
         review_count = excluded.review_count
       returning *`,
      [
        state.cardId,
        state.userId,
        state.intervalDays,
        state.easeFactor,
        state.nextReviewDate,
        state.lastReviewedAt,
        state.reviewCount,
      ],
    );
    return reviewStateFromRow(rows[0]);
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
