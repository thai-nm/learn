import type { AuthVerifier } from "./verifier.js";

export const EMAIL_HEADER = "x-user-email";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Identity, not authentication: the client sends the email it wants to
 * act as, unverified (no password, no SSO, no proof of ownership) — the
 * whole point is a zero-friction "who are you" instead of a login flow.
 * Trimmed/lowercased so the same address doesn't fork into two identities
 * from casing differences. Anyone who knows/guesses an email can access
 * that email's decks; acceptable for a low-stakes personal study app.
 */
export function createEmailIdentityVerifier(): AuthVerifier {
  return async (req) => {
    const raw = req.header(EMAIL_HEADER);
    if (!raw) return null;

    const email = raw.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(email)) return null;

    return { email };
  };
}
