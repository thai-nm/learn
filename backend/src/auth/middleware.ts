import type { NextFunction, Request, Response } from "express";
import type { AuthenticatedUser, AuthVerifier } from "./verifier.js";

export interface AuthedRequest extends Request {
  user: AuthenticatedUser;
}

export function requireAuth(verifier: AuthVerifier) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = await verifier(req);
    if (!user) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }

    (req as unknown as AuthedRequest).user = user;
    next();
  };
}

/** Reads the user attached by requireAuth. Only call this on routes mounted behind it. */
export function getAuthedUser(req: Request): AuthenticatedUser {
  return (req as unknown as AuthedRequest).user;
}
