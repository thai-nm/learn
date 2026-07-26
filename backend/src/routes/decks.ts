import { Router } from "express";
import { getAuthedUser } from "../auth/middleware.js";
import { canReadDeck } from "../domain/access.js";
import type { Repository } from "../domain/repository.js";

export function decksRouter(repository: Repository): Router {
  const router = Router();

  router.get("/", async (req, res) => {
    const email = getAuthedUser(req).email;
    let decks = await repository.listDecks(email);

    if (!decks.some((deck) => deck.ownerEmail === email)) {
      const personalDeck = await repository.createDeck({
        ownerEmail: email,
        title: "My Cards",
        description: "",
        topics: [],
        visibility: "personal",
      });
      decks = [...decks, personalDeck];
    }

    res.json(decks);
  });

  router.post("/", async (req, res) => {
    const email = getAuthedUser(req).email;
    const { title, description, topics, visibility } = req.body ?? {};
    if (typeof title !== "string" || title.length === 0) {
      res.status(400).json({ error: "title is required" });
      return;
    }
    const deck = await repository.createDeck({
      ownerEmail: email,
      title,
      description: typeof description === "string" ? description : "",
      topics: Array.isArray(topics) ? topics : [],
      visibility: visibility === "shared" ? "shared" : "personal",
    });
    res.status(201).json(deck);
  });

  router.get("/:deckId/cards", async (req, res) => {
    const email = getAuthedUser(req).email;
    const deck = await repository.getDeck(req.params.deckId);
    if (!deck || !canReadDeck(deck, email)) {
      res.status(404).json({ error: "deck not found" });
      return;
    }
    res.json(await repository.listCardsByDeck(req.params.deckId));
  });

  return router;
}
