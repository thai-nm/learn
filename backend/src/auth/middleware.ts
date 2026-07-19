import type { NextFunction, Request, Response } from "express";
import type { AuthVerifier } from "./verifier.js";

const BEARER_PREFIX = "Bearer ";

export function requireAuth(verifier: AuthVerifier) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const header = req.header("authorization");
    if (!header || !header.startsWith(BEARER_PREFIX)) {
      res.status(401).json({ error: "missing bearer token" });
      return;
    }

    const token = header.slice(BEARER_PREFIX.length);
    const valid = await verifier(token);
    if (!valid) {
      res.status(401).json({ error: "invalid or expired session" });
      return;
    }

    next();
  };
}
