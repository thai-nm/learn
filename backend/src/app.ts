import express, { type Express } from "express";
import { requireAuth } from "./auth/middleware.js";
import type { AuthVerifier } from "./auth/verifier.js";
import type { Repository } from "./domain/repository.js";
import { cardsRouter } from "./routes/cards.js";
import { decksRouter } from "./routes/decks.js";
import { reviewsRouter } from "./routes/reviews.js";

export function createApp(repository: Repository, authVerifier: AuthVerifier): Express {
  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use(requireAuth(authVerifier));

  app.use("/api/decks", decksRouter(repository));
  app.use("/api/cards", cardsRouter(repository));
  app.use("/api/reviews", reviewsRouter(repository));

  return app;
}
