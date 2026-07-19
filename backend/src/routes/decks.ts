import { Router } from "express";
import type { Repository } from "../domain/repository.js";

export function decksRouter(repository: Repository): Router {
  const router = Router();

  router.get("/", async (_req, res) => {
    res.json(await repository.listDecks());
  });

  router.post("/", async (req, res) => {
    const { title, description, topics, visibility } = req.body ?? {};
    if (typeof title !== "string" || title.length === 0) {
      res.status(400).json({ error: "title is required" });
      return;
    }
    const deck = await repository.createDeck({
      title,
      description: typeof description === "string" ? description : "",
      topics: Array.isArray(topics) ? topics : [],
      visibility: visibility === "shared" ? "shared" : "personal",
    });
    res.status(201).json(deck);
  });

  router.get("/:deckId/cards", async (req, res) => {
    const deck = await repository.getDeck(req.params.deckId);
    if (!deck) {
      res.status(404).json({ error: "deck not found" });
      return;
    }
    res.json(await repository.listCardsByDeck(req.params.deckId));
  });

  return router;
}
