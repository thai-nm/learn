import type { AuthVerifier } from "./verifier.js";

/**
 * Local-dev-only stand-in: there's no way to produce a real
 * Cloudflare-signed assertion outside Cloudflare's own infrastructure,
 * so local dev always "authenticates" as a fixed dev identity instead.
 * Selected by index.ts only when DEV_USER_EMAIL is set — never set in
 * the deployed environment, so this can't accidentally run in prod.
 */
export function createDevVerifier(email: string): AuthVerifier {
  return async () => ({ email });
}
