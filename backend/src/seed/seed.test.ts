import { describe, expect, it } from "vitest";
import { InMemoryRepository } from "../repositories/inMemoryRepository.js";
import { seedStarterDeck } from "./seed.js";
import { SEED_OWNER_EMAIL, STARTER_DECK } from "./starterDeck.js";

describe("seedStarterDeck", () => {
  it("creates the starter deck with all its cards attached", async () => {
    const repo = new InMemoryRepository();
    await seedStarterDeck(repo);

    const decks = await repo.listDecks(SEED_OWNER_EMAIL);
    expect(decks).toHaveLength(1);
    expect(decks[0].title).toBe(STARTER_DECK.title);
    expect(decks[0].visibility).toBe("shared");

    const cards = await repo.listCardsByDeck(decks[0].id);
    expect(cards.length).toBeGreaterThanOrEqual(20);
    expect(cards.length).toBeLessThanOrEqual(30);

    const topicsUsed = new Set(cards.map((c) => c.topic));
    for (const topic of STARTER_DECK.topics) {
      expect(topicsUsed.has(topic)).toBe(true);
    }
  });
});
