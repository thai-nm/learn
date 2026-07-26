import type { DatabaseSync } from "node:sqlite";

// Applied on every startup (idempotent) — SQLite is an embedded file, so
// there's no separate migration-runner/CLI to own this. New columns on
// existing tables need an explicit ensureColumn() below: `create table if
// not exists` is a no-op once the table already exists, so it can't add
// columns to a database created before that column existed.
const TABLES = `
  pragma foreign_keys = on;

  create table if not exists decks (
    id text primary key,
    owner_email text not null,
    title text not null,
    description text not null default '',
    topics text not null default '[]',
    visibility text not null default 'personal' check (visibility in ('personal', 'shared'))
  );

  create table if not exists cards (
    id text primary key,
    deck_id text not null references decks (id) on delete cascade,
    front text not null,
    back text not null,
    why text,
    topic text not null
  );

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
`;

const INDEXES = `
  create index if not exists decks_owner_email_idx on decks (owner_email);
  create index if not exists cards_deck_id_idx on cards (deck_id);
  create index if not exists review_states_next_review_date_idx on review_states (next_review_date);
`;

export function migrate(db: DatabaseSync): void {
  db.exec(TABLES);
  ensureColumn(db, "decks", "owner_email", "text not null default ''");
  db.exec(INDEXES);
}

function ensureColumn(db: DatabaseSync, table: string, column: string, definition: string): void {
  const columns = db.prepare(`pragma table_info(${table})`).all() as { name: string }[];
  if (!columns.some((c) => c.name === column)) {
    db.exec(`alter table ${table} add column ${column} ${definition}`);
  }
}
