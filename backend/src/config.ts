export interface PostgresConfig {
  connectionString: string;
}

/**
 * Reads a plain Postgres connection string — deliberately not a Supabase
 * SDK config. Supabase is used only as a hosted Postgres provider; the
 * app talks to it as "a Postgres database," so swapping to self-hosted
 * Postgres later is just changing this connection string.
 */
export function getPostgresConfig(): PostgresConfig {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "Missing DATABASE_URL environment variable. Copy backend/.env.example to backend/.env " +
        "for local dev, or set it in the deployment environment.",
    );
  }

  return { connectionString };
}

export interface CloudflareAccessConfig {
  teamDomain: string;
  audience: string;
}

/**
 * Cloudflare Access identity settings — the app trusts Cloudflare's
 * signed JWT assertion rather than implementing any login itself. Both
 * values come from the Access Application in the Cloudflare Zero Trust
 * dashboard (team domain, and the Application Audience tag).
 */
export function getCloudflareAccessConfig(): CloudflareAccessConfig {
  const teamDomain = process.env.CF_ACCESS_TEAM_DOMAIN;
  const audience = process.env.CF_ACCESS_AUD;

  if (!teamDomain || !audience) {
    throw new Error("Missing CF_ACCESS_TEAM_DOMAIN and/or CF_ACCESS_AUD environment variables.");
  }

  return { teamDomain, audience };
}
