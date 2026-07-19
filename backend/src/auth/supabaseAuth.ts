import { createClient } from "@supabase/supabase-js";
import type { AuthConfig } from "../config.js";
import type { AuthVerifier } from "./verifier.js";

/**
 * Signs in the fixed account server-side and returns the resulting
 * access token. The password never reaches the frontend.
 */
export async function signInFixedUser(
  config: AuthConfig,
): Promise<{ accessToken: string; expiresAt: number | undefined }> {
  const client = createClient(config.supabaseUrl, config.anonKey, {
    auth: { persistSession: false },
  });
  const { data, error } = await client.auth.signInWithPassword({
    email: config.fixedUserEmail,
    password: config.fixedUserPassword,
  });
  if (error) throw error;
  return { accessToken: data.session.access_token, expiresAt: data.session.expires_at };
}

/** Verifies a bearer token belongs to a valid session for the fixed account's email. */
export function createSupabaseAuthVerifier(config: AuthConfig): AuthVerifier {
  const client = createClient(config.supabaseUrl, config.anonKey, {
    auth: { persistSession: false },
  });

  return async (token: string) => {
    const { data, error } = await client.auth.getUser(token);
    if (error || !data.user) return false;
    return data.user.email === config.fixedUserEmail;
  };
}
