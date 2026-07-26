import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";
import { InMemoryRepository } from "./repositories/inMemoryRepository.js";
import type { Repository } from "./domain/repository.js";
import type { AuthVerifier } from "./auth/verifier.js";

const asUser =
  (email: string): AuthVerifier =>
  async () => ({ email });
const alwaysAllow = asUser("test@example.com");

let repository: Repository;
let app: ReturnType<typeof createApp>;

beforeEach(() => {
  repository = new InMemoryRepository();
  app = createApp(repository, alwaysAllow);
});

describe("GET /health", () => {
  it("returns ok without requiring auth", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

describe("identity", () => {
  it("rejects requests when the verifier rejects the request", async () => {
    const denyAll: AuthVerifier = async () => null;
    const deniedApp = createApp(new InMemoryRepository(), denyAll);
    const res = await request(deniedApp).get("/api/decks");
    expect(res.status).toBe(401);
  });
});

describe("decks + cards", () => {
  it("auto-provisions a personal deck for a new email on first list", async () => {
    const res = await request(app).get("/api/decks");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({
      ownerEmail: "test@example.com",
      title: "My Cards",
      visibility: "personal",
    });

    // Calling again doesn't provision a second one.
    const again = await request(app).get("/api/decks");
    expect(again.body).toHaveLength(1);
  });

  it("creates a deck, then creates and lists a card under it", async () => {
    const deckRes = await request(app)
      .post("/api/decks")
      .send({ title: "Test Deck", description: "d", topics: ["A"], visibility: "personal" });
    expect(deckRes.status).toBe(201);
    expect(deckRes.body.ownerEmail).toBe("test@example.com");
    const deckId = deckRes.body.id;

    const cardRes = await request(app)
      .post("/api/cards")
      .send({ deckId, front: "Q", back: "A", topic: "A" });
    expect(cardRes.status).toBe(201);

    const listRes = await request(app).get(`/api/decks/${deckId}/cards`);
    expect(listRes.status).toBe(200);
    expect(listRes.body).toHaveLength(1);
    expect(listRes.body[0].front).toBe("Q");
  });

  it("rejects card creation for a missing deck", async () => {
    const res = await request(app)
      .post("/api/cards")
      .send({ deckId: "does-not-exist", front: "Q", back: "A", topic: "A" });
    expect(res.status).toBe(404);
  });

  it("updates and deletes a card", async () => {
    const deckRes = await request(app)
      .post("/api/decks")
      .send({ title: "D", description: "", topics: [], visibility: "personal" });
    const cardRes = await request(app)
      .post("/api/cards")
      .send({ deckId: deckRes.body.id, front: "Q", back: "A", topic: "t" });

    const patchRes = await request(app)
      .patch(`/api/cards/${cardRes.body.id}`)
      .send({ back: "Updated answer" });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.back).toBe("Updated answer");

    const deleteRes = await request(app).delete(`/api/cards/${cardRes.body.id}`);
    expect(deleteRes.status).toBe(204);
  });

  it("hides another user's personal deck from listing and card access", async () => {
    const deckRes = await request(app)
      .post("/api/decks")
      .send({ title: "Private", description: "", topics: [], visibility: "personal" });

    const otherApp = createApp(repository, asUser("someone-else@example.com"));
    const listRes = await request(otherApp).get(`/api/decks/${deckRes.body.id}/cards`);
    expect(listRes.status).toBe(404);

    const decksRes = await request(otherApp).get("/api/decks");
    expect(decksRes.body.map((d: { id: string }) => d.id)).not.toContain(deckRes.body.id);
  });

  it("forbids adding, editing, or deleting cards in a deck you don't own, even if shared", async () => {
    const deckRes = await request(app)
      .post("/api/decks")
      .send({ title: "Shared", description: "", topics: [], visibility: "shared" });
    const cardRes = await request(app)
      .post("/api/cards")
      .send({ deckId: deckRes.body.id, front: "Q", back: "A", topic: "t" });

    const otherApp = createApp(repository, asUser("someone-else@example.com"));

    const createRes = await request(otherApp)
      .post("/api/cards")
      .send({ deckId: deckRes.body.id, front: "Q2", back: "A2", topic: "t" });
    expect(createRes.status).toBe(403);

    const patchRes = await request(otherApp)
      .patch(`/api/cards/${cardRes.body.id}`)
      .send({ back: "hijacked" });
    expect(patchRes.status).toBe(403);

    const deleteRes = await request(otherApp).delete(`/api/cards/${cardRes.body.id}`);
    expect(deleteRes.status).toBe(403);
  });
});

describe("reviews", () => {
  it("grades a card and reflects it in the next due pull", async () => {
    const deckRes = await request(app)
      .post("/api/decks")
      .send({ title: "D", description: "", topics: [], visibility: "personal" });
    const cardRes = await request(app)
      .post("/api/cards")
      .send({ deckId: deckRes.body.id, front: "Q", back: "A", topic: "t" });
    const cardId = cardRes.body.id;

    const dueBefore = await request(app).get("/api/reviews/due");
    expect(dueBefore.body.map((d: { card: { id: string } }) => d.card.id)).toContain(cardId);

    const gradeRes = await request(app).post(`/api/reviews/${cardId}`).send({ grade: "good" });
    expect(gradeRes.status).toBe(200);
    expect(gradeRes.body.intervalDays).toBe(1);
    expect(gradeRes.body.reviewCount).toBe(1);
    expect(gradeRes.body.userId).toBe("test@example.com");

    const dueAfter = await request(app).get("/api/reviews/due");
    expect(dueAfter.body.map((d: { card: { id: string } }) => d.card.id)).not.toContain(cardId);
  });

  it("scopes review state per user on a shared deck's cards", async () => {
    const deckRes = await request(app)
      .post("/api/decks")
      .send({ title: "D", description: "", topics: [], visibility: "shared" });
    const cardRes = await request(app)
      .post("/api/cards")
      .send({ deckId: deckRes.body.id, front: "Q", back: "A", topic: "t" });
    const cardId = cardRes.body.id;

    await request(app).post(`/api/reviews/${cardId}`).send({ grade: "good" });

    const otherUserApp = createApp(repository, asUser("someone-else@example.com"));
    const dueForOtherUser = await request(otherUserApp).get("/api/reviews/due");
    expect(dueForOtherUser.body.map((d: { card: { id: string } }) => d.card.id)).toContain(cardId);
  });

  it("hides a personal deck's cards from another user's due pull", async () => {
    const deckRes = await request(app)
      .post("/api/decks")
      .send({ title: "D", description: "", topics: [], visibility: "personal" });
    const cardRes = await request(app)
      .post("/api/cards")
      .send({ deckId: deckRes.body.id, front: "Q", back: "A", topic: "t" });

    const otherUserApp = createApp(repository, asUser("someone-else@example.com"));
    const dueForOtherUser = await request(otherUserApp).get("/api/reviews/due");
    expect(dueForOtherUser.body.map((d: { card: { id: string } }) => d.card.id)).not.toContain(
      cardRes.body.id,
    );
  });

  it("rejects an invalid grade", async () => {
    const res = await request(app).post("/api/reviews/whatever").send({ grade: "terrible" });
    expect(res.status).toBe(400);
  });

  it("404s grading a card that doesn't exist", async () => {
    const res = await request(app).post("/api/reviews/nope").send({ grade: "good" });
    expect(res.status).toBe(404);
  });
});
