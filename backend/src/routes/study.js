
const express = require("express");
const { z } = require("zod");
const prisma = require("../prisma");

const router = express.Router();

const queueQuerySchema = z.object({
  userId: z.string().min(1),
});

function localMidnightAsUtc(year, month, day, timezone) {
  const target = Date.UTC(year, month - 1, day);
  let guess = target;

  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  for (let i = 0; i < 4; i += 1) {
    const parts = Object.fromEntries(
      formatter.formatToParts(new Date(guess)).map(({ type, value }) => [
        type,
        value,
      ])
    );

    const representedAsUtc = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second)
    );

    const difference = target - representedAsUtc;
    guess += difference;

    if (difference === 0) break;
  }

  return new Date(guess);
}

router.get("/due", async (req, res) => {
  const result = queueQuerySchema.safeParse(req.query);

  if (!result.success) {
    return res.status(400).json({
      error: "A valid userId is required",
    });
  }

  const { userId } = result.data;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { settings: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const timezone = user.settings?.timezone || "Asia/Kolkata";
    const dailyNewCardLimit = user.settings?.dailyNewCardLimit ?? 20;
    const now = new Date();

    const parts = Object.fromEntries(
      new Intl.DateTimeFormat("en-GB", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
        .formatToParts(now)
        .map(({ type, value }) => [type, value])
    );

    const year = Number(parts.year);
    const month = Number(parts.month);
    const day = Number(parts.day);

    const startOfDay = localMidnightAsUtc(
      year,
      month,
      day,
      timezone
    );

    const nextCalendarDay = new Date(Date.UTC(year, month - 1, day + 1));

    const nextDay = localMidnightAsUtc(
      nextCalendarDay.getUTCFullYear(),
      nextCalendarDay.getUTCMonth() + 1,
      nextCalendarDay.getUTCDate(),
      timezone
    );

    const decks = await prisma.deck.findMany({
      where: { userId },
      select: { id: true },
    });

    const deckIds = decks.map((deck) => deck.id);

    const dueCards = await prisma.card.findMany({
      where: {
        deckId: { in: deckIds },
        nextReviewAt: { lt: nextDay },
        NOT: {
          repetitions: 0,
          intervalDays: 0,
        },
      },
      include: {
        deck: {
          select: { id: true, name: true },
        },
      },
      orderBy: { nextReviewAt: "asc" },
    });

    const newCardsReviewedToday = await prisma.card.count({
      where: {
        deckId: { in: deckIds },
        firstStudiedAt: {
          gte: startOfDay,
          lt: nextDay,
        },
      },
    });

    const remainingNewCards = Math.max(
      0,
      dailyNewCardLimit - newCardsReviewedToday
    );

    const newCards = remainingNewCards > 0
      ? await prisma.card.findMany({
          where: {
            deckId: { in: deckIds },
            repetitions: 0,
            intervalDays: 0,
            firstStudiedAt: null,
          },
          include: {
            deck: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: "asc" },
          take: remainingNewCards,
        })
      : [];

    const cards = [...dueCards, ...newCards];

    res.json({
      timezone,
      startOfDay: startOfDay.toISOString(),
      nextDay: nextDay.toISOString(),
      dailyNewCardLimit,
      newCardsReviewedToday,
      remainingNewCards,
      dueCount: cards.length,
      cards,
    });
  } catch (error) {
    console.error("Failed to fetch due cards:", error.message);
    res.status(500).json({ error: "Failed to fetch due cards" });
  }
});

module.exports = router;
