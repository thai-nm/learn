import { Router } from "express";
import { FIXED_USER_ID } from "../config.js";
import type { Repository } from "../domain/repository.js";
import { scheduleNextReview, type Grade } from "../scheduling/sm2.js";

const VALID_GRADES: Grade[] = ["again", "hard", "good", "easy"];

export function reviewsRouter(repository: Repository): Router {
  const router = Router();

  router.get("/due", async (_req, res) => {
    const due = await repository.getDueCards(FIXED_USER_ID, new Date());
    res.json(due);
  });

  router.post("/:cardId", async (req, res) => {
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

    const existing = await repository.getReviewState(FIXED_USER_ID, req.params.cardId);
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
      userId: FIXED_USER_ID,
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
