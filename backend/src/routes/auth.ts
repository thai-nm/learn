import { Router } from "express";
import { signInFixedUser } from "../auth/supabaseAuth.js";
import type { AuthConfig } from "../config.js";

export function authRouter(config: AuthConfig): Router {
  const router = Router();

  router.post("/session", async (_req, res) => {
    try {
      const { accessToken, expiresAt } = await signInFixedUser(config);
      res.json({ accessToken, expiresAt });
    } catch {
      res.status(502).json({ error: "failed to establish a session" });
    }
  });

  return router;
}
