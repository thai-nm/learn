import { describe, expect, it } from "vitest";
import { InMemoryRepository } from "./inMemoryRepository.js";

const userId = "fixed-user";

describe("InMemoryRepository", () => {
  it("returns only cards whose review state is due", async () => {
    const repo = new InMemoryRepository();
    const deck = await repo.createDeck({
      title: "Deck",
      description: "",
      topics: ["Reliability"],
      visibility: "personal",
    });
    const dueCard = await repo.createCard({
      deckId: deck.id,
      front: "due?",
      back: "yes",
      topic: "Reliability",
    });
    await repo.createCard({ deckId: deck.id, front: "not due?", back: "no", topic: "Reliability" });

    await repo.upsertReviewState({
      cardId: dueCard.id,
      userId,
      intervalDays: 1,
      easeFactor: 2.5,
      nextReviewDate: new Date("2020-01-01"),
      lastReviewedAt: new Date("2019-12-31"),
      reviewCount: 1,
    });

    const due = await repo.getDueCards(userId, new Date("2026-07-19"));
    expect(due).toHaveLength(2); // the never-reviewed card defaults to due (epoch), plus dueCard
    expect(due.map((d) => d.card.id)).toContain(dueCard.id);
  });

  it("interleaves due cards across topics instead of grouping by topic", async () => {
    const repo = new InMemoryRepository();
    const deck = await repo.createDeck({
      title: "Deck",
      description: "",
      topics: ["A", "B"],
      visibility: "personal",
    });

    for (let i = 0; i < 3; i++) {
      await repo.createCard({ deckId: deck.id, front: `a${i}`, back: "x", topic: "A" });
    }
    for (let i = 0; i < 2; i++) {
      await repo.createCard({ deckId: deck.id, front: `b${i}`, back: "x", topic: "B" });
    }

    const due = await repo.getDueCards(userId, new Date());
    const topicSequence = due.map((d) => d.card.topic);

    expect(topicSequence).toEqual(["A", "B", "A", "B", "A"]);
  });

  it("updates and deletes cards", async () => {
    const repo = new InMemoryRepository();
    const deck = await repo.createDeck({
      title: "Deck",
      description: "",
      topics: [],
      visibility: "personal",
    });
    const card = await repo.createCard({ deckId: deck.id, front: "f", back: "b", topic: "t" });

    const updated = await repo.updateCard(card.id, { back: "updated" });
    expect(updated?.back).toBe("updated");

    const deleted = await repo.deleteCard(card.id);
    expect(deleted).toBe(true);
    expect(await repo.getCard(card.id)).toBeUndefined();
  });
});
