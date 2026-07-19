/** Single fixed identity for v1 — see docs/PLAN.md Section 5 (no login UI, no multi-user). */
export const FIXED_USER_ID = "default-user";

export interface SupabaseConfig {
  url: string;
  serviceRoleKey: string;
}

/**
 * Reads Supabase connection details from the environment with no
 * hardcoded fallback — local dev supplies them via backend/.env
 * (copied from .env.example), while a deployed container is expected
 * to receive them injected by the runtime (e.g. a Kubernetes manifest's
 * env/envFrom), per docs/PLAN.md Section 5.
 */
export function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY environment variables. " +
        "Copy backend/.env.example to backend/.env for local dev, or set them in the deployment environment.",
    );
  }

  return { url, serviceRoleKey };
}

export interface AuthConfig {
  supabaseUrl: string;
  anonKey: string;
  fixedUserEmail: string;
  fixedUserPassword: string;
}

/**
 * Credentials for the single fixed Supabase Auth account (docs/PLAN.md
 * Section 5 — no signup/login UI). The password never leaves the
 * backend: POST /api/auth/session signs in server-side and hands the
 * frontend only the resulting token.
 */
export function getAuthConfig(): AuthConfig {
  const supabaseUrl = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const fixedUserEmail = process.env.SUPABASE_FIXED_USER_EMAIL;
  const fixedUserPassword = process.env.SUPABASE_FIXED_USER_PASSWORD;

  if (!supabaseUrl || !anonKey || !fixedUserEmail || !fixedUserPassword) {
    throw new Error(
      "Missing SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_FIXED_USER_EMAIL, and/or " +
        "SUPABASE_FIXED_USER_PASSWORD environment variables.",
    );
  }

  return { supabaseUrl, anonKey, fixedUserEmail, fixedUserPassword };
}
