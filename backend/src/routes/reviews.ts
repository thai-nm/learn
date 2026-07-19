import { Router } from "express";
import { getAuthedUser } from "../auth/middleware.js";
import type { Repository } from "../domain/repository.js";
import { scheduleNextReview, type Grade } from "../scheduling/sm2.js";

const VALID_GRADES: Grade[] = ["again", "hard", "good", "easy"];

export function reviewsRouter(repository: Repository): Router {
  const router = Router();

  router.get("/due", async (req, res) => {
    const userId = getAuthedUser(req).email;
    const due = await repository.getDueCards(userId, new Date());
    res.json(due);
  });

  router.post("/:cardId", async (req, res) => {
    const userId = getAuthedUser(req).email;
    const { grade } = req.body ?? {};
    if (!VALID_GRADES.includes(grade)) {
      res.status(400).json({ error: `grade must be one of ${VALID_GRADES.join(", ")}` });
      return;
    }

    const card = await repository.getCard(req.params.cardId);
    if (!card) {
      res.status(404).json({ error: "card not found" });
      return;
    }

    const existing = await repository.getReviewState(userId, req.params.cardId);
    const now = new Date();
    const result = scheduleNextReview(
      {
        intervalDays: existing?.intervalDays ?? 0,
        easeFactor: existing?.easeFactor ?? 2.5,
        reviewCount: existing?.reviewCount ?? 0,
      },
      grade as Grade,
      now,
    );

    const updated = await repository.upsertReviewState({
      cardId: req.params.cardId,
      userId,
      intervalDays: result.intervalDays,
      easeFactor: result.easeFactor,
      reviewCount: result.reviewCount,
      nextReviewDate: result.nextReviewDate,
      lastReviewedAt: result.lastReviewedAt,
    });

    res.json(updated);
  });

  return router;
}
