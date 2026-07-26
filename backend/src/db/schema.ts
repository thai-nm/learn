import type { DatabaseSync } from "node:sqlite";

// Applied on every startup (all statements are idempotent) — SQLite is an
// embedded file, so there's no separate migration-runner/CLI to own this.
const SCHEMA = `
  pragma foreign_keys = on;

  create table if not exists decks (
    id text primary key,
    owner_email text not null,
    title text not null,
    description text not null default '',
    topics text not null default '[]',
    visibility text not null default 'personal' check (visibility in ('personal', 'shared'))
  );

  create index if not exists decks_owner_email_idx on decks (owner_email);

  create table if not exists cards (
    id text primary key,
    deck_id text not null references decks (id) on delete cascade,
    front text not null,
    back text not null,
    why text,
    topic text not null
  );

  create index if not exists cards_deck_id_idx on cards (deck_id);

  create table if not exists review_states (
    card_id text not null references cards (id) on delete cascade,
    user_id text not null default 'default-user',
    interval_days integer not null default 0,
    ease_factor real not null default 2.5,
    next_review_date text not null,
    last_reviewed_at text,
    review_count integer not null default 0,
    primary key (card_id, user_id)
  );

  create index if not exists review_states_next_review_date_idx on review_states (next_review_date);
`;

export function migrate(db: DatabaseSync): void {
  db.exec(SCHEMA);
}
