import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";
import { InMemoryRepository } from "./repositories/inMemoryRepository.js";
import type { Repository } from "./domain/repository.js";
import type { AuthConfig } from "./config.js";

const authConfig: AuthConfig = {
  supabaseUrl: "http://localhost:0",
  anonKey: "test-anon-key",
  fixedUserEmail: "test@example.com",
  fixedUserPassword: "test-password",
};
const alwaysAllow = async () => true;
const AUTH = { Authorization: "Bearer test-token" };

let repository: Repository;
let app: ReturnType<typeof createApp>;

beforeEach(() => {
  repository = new InMemoryRepository();
  app = createApp(repository, authConfig, alwaysAllow);
});

describe("GET /health", () => {
  it("returns ok without requiring auth", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

describe("auth", () => {
  it("rejects requests with no bearer token", async () => {
    const res = await request(app).get("/api/decks");
    expect(res.status).toBe(401);
  });

  it("rejects requests when the verifier rejects the token", async () => {
    const denyAll = async () => false;
    const deniedApp = createApp(new InMemoryRepository(), authConfig, denyAll);
    const res = await request(deniedApp).get("/api/decks").set(AUTH);
    expect(res.status).toBe(401);
  });
});

describe("decks + cards", () => {
  it("creates a deck, then creates and lists a card under it", async () => {
    const deckRes = await request(app)
      .post("/api/decks")
      .set(AUTH)
      .send({ title: "Test Deck", description: "d", topics: ["A"], visibility: "personal" });
    expect(deckRes.status).toBe(201);
    const deckId = deckRes.body.id;

    const cardRes = await request(app)
      .post("/api/cards")
      .set(AUTH)
      .send({ deckId, front: "Q", back: "A", topic: "A" });
    expect(cardRes.status).toBe(201);

    const listRes = await request(app).get(`/api/decks/${deckId}/cards`).set(AUTH);
    expect(listRes.status).toBe(200);
    expect(listRes.body).toHaveLength(1);
    expect(listRes.body[0].front).toBe("Q");
  });

  it("rejects card creation for a missing deck", async () => {
    const res = await request(app)
      .post("/api/cards")
      .set(AUTH)
      .send({ deckId: "does-not-exist", front: "Q", back: "A", topic: "A" });
    expect(res.status).toBe(404);
  });

  it("updates and deletes a card", async () => {
    const deckRes = await request(app)
      .post("/api/decks")
      .set(AUTH)
      .send({ title: "D", description: "", topics: [], visibility: "personal" });
    const cardRes = await request(app)
      .post("/api/cards")
      .set(AUTH)
      .send({ deckId: deckRes.body.id, front: "Q", back: "A", topic: "t" });

    const patchRes = await request(app)
      .patch(`/api/cards/${cardRes.body.id}`)
      .set(AUTH)
      .send({ back: "Updated answer" });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.back).toBe("Updated answer");

    const deleteRes = await request(app).delete(`/api/cards/${cardRes.body.id}`).set(AUTH);
    expect(deleteRes.status).toBe(204);
  });
});

describe("reviews", () => {
  it("grades a card and reflects it in the next due pull", async () => {
    const deckRes = await request(app)
      .post("/api/decks")
      .set(AUTH)
      .send({ title: "D", description: "", topics: [], visibility: "personal" });
    const cardRes = await request(app)
      .post("/api/cards")
      .set(AUTH)
      .send({ deckId: deckRes.body.id, front: "Q", back: "A", topic: "t" });
    const cardId = cardRes.body.id;

    const dueBefore = await request(app).get("/api/reviews/due").set(AUTH);
    expect(dueBefore.body.map((d: { card: { id: string } }) => d.card.id)).toContain(cardId);

    const gradeRes = await request(app)
      .post(`/api/reviews/${cardId}`)
      .set(AUTH)
      .send({ grade: "good" });
    expect(gradeRes.status).toBe(200);
    expect(gradeRes.body.intervalDays).toBe(1);
    expect(gradeRes.body.reviewCount).toBe(1);

    const dueAfter = await request(app).get("/api/reviews/due").set(AUTH);
    expect(dueAfter.body.map((d: { card: { id: string } }) => d.card.id)).not.toContain(cardId);
  });

  it("rejects an invalid grade", async () => {
    const res = await request(app)
      .post("/api/reviews/whatever")
      .set(AUTH)
      .send({ grade: "terrible" });
    expect(res.status).toBe(400);
  });

  it("404s grading a card that doesn't exist", async () => {
    const res = await request(app).post("/api/reviews/nope").set(AUTH).send({ grade: "good" });
    expect(res.status).toBe(404);
  });
});
