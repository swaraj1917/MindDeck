
const express = require("express");
const { z } = require("zod");
const prisma = require("../prisma");
const { scheduleReview } = require("../services/reviewScheduler");

const router = express.Router();

const reviewSchema = z.object({
  userId: z.string().min(1),
  cardId: z.string().min(1),
  rating: z.enum(["AGAIN", "HARD", "GOOD", "EASY"]),
});

router.post("/", async (req, res) => {
  const result = reviewSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: "Invalid review details",
      details: result.error.issues,
    });
  }

  const { userId, cardId, rating } = result.data;

  try {
    const card = await prisma.card.findUnique({
      where: { id: cardId },
    });

    if (!card) {
      return res.status(404).json({
        error: "Card not found",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    const deck = await prisma.deck.findFirst({
      where: {
        id: card.deckId,
        userId,
      },
    });

    if (!deck) {
      return res.status(403).json({
        error: "You cannot review this card",
      });
    }

    const beforeInterval = card.intervalDays;
    const schedule = scheduleReview(card, rating);

    if (!card.firstStudiedAt) {
      schedule.firstStudiedAt = new Date();
    }

    const review = await prisma.$transaction(async (tx) => {
      const updatedCard = await tx.card.update({
        where: { id: cardId },
        data: schedule,
      });

      const reviewRecord = await tx.review.create({
        data: {
          userId,
          cardId,
          rating,
          intervalBefore: beforeInterval,
          intervalAfter: schedule.intervalDays,
        },
      });

      return {
        updatedCard,
        review: reviewRecord,
      };
    });

    return res.status(201).json(review);
  } catch (error) {
    console.error("Failed to save review:", error.message);

    return res.status(500).json({
      error: "Failed to save review",
    });
  }
});

module.exports = router;
