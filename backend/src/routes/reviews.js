const express = require('express');
const { z } = require('zod');
const prisma = require('../prisma');
const { scheduleReview } = require('../services/reviewScheduler');

const router = express.Router();

const reviewSchema = z.object({
  cardId: z.string().min(1),
  rating: z.enum(['AGAIN', 'HARD', 'GOOD', 'EASY']),
});

router.post('/', async (req, res) => {
  const result = reviewSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: 'Invalid review details',
      details: result.error.issues,
    });
  }

  const { cardId, rating } = result.data;
  const userId = req.userId;

  try {
    const card = await prisma.card.findFirst({
      where: { id: cardId, deck: { userId } },
    });

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
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

      return { updatedCard, review: reviewRecord };
    });

    return res.status(201).json(review);
  } catch (error) {
    console.error('Failed to save review:', error.message);
    return res.status(500).json({ error: 'Failed to save review' });
  }
});

module.exports = router;