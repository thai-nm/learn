import { Router } from "express";
import type { Repository } from "../domain/repository.js";

export function cardsRouter(repository: Repository): Router {
  const router = Router();

  router.post("/", async (req, res) => {
    const { deckId, front, back, why, topic } = req.body ?? {};
    if (
      typeof deckId !== "string" ||
      typeof front !== "string" ||
      typeof back !== "string" ||
      typeof topic !== "string"
    ) {
      res.status(400).json({ error: "deckId, front, back, and topic are required" });
      return;
    }
    const deck = await repository.getDeck(deckId);
    if (!deck) {
      res.status(404).json({ error: "deck not found" });
      return;
    }
    const card = await repository.createCard({
      deckId,
      front,
      back,
      topic,
      why: typeof why === "string" ? why : undefined,
    });
    res.status(201).json(card);
  });

  router.patch("/:cardId", async (req, res) => {
    const { front, back, why, topic } = req.body ?? {};
    const updated = await repository.updateCard(req.params.cardId, {
      front: typeof front === "string" ? front : undefined,
      back: typeof back === "string" ? back : undefined,
      why: typeof why === "string" ? why : undefined,
      topic: typeof topic === "string" ? topic : undefined,
    });
    if (!updated) {
      res.status(404).json({ error: "card not found" });
      return;
    }
    res.json(updated);
  });

  router.delete("/:cardId", async (req, res) => {
    const deleted = await repository.deleteCard(req.params.cardId);
    if (!deleted) {
      res.status(404).json({ error: "card not found" });
      return;
    }
    res.status(204).send();
  });

  return router;
}
