import type { Request } from "express";

export interface AuthenticatedUser {
  email: string;
}

/** Inspects the request and returns the authenticated user, or null if unauthenticated. */
export type AuthVerifier = (req: Request) => Promise<AuthenticatedUser | null>;
