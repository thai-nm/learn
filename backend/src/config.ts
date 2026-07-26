export interface SqliteConfig {
  path: string;
}

/**
 * SQLite file path — defaults to a path under the repo/container rather
 * than requiring an env var, since there's no external service to
 * provision. Override with DATABASE_PATH in prod to point at a mounted
 * persistent volume (the file must survive container restarts).
 */
export function getSqliteConfig(): SqliteConfig {
  return { path: process.env.DATABASE_PATH ?? "./data/learn.db" };
}
