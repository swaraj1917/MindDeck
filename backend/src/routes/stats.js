
const express = require("express");
const { z } = require("zod");
const prisma = require("../prisma");

const router = express.Router();

const querySchema = z.object({
  userId: z.string().trim().min(1),
});

function getDateKey(date, timezone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  return `${values.year}-${values.month}-${values.day}`;
}

function shiftDateKey(dateKey, amount) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + amount));

  return date.toISOString().slice(0, 10);
}

router.get("/", async (req, res) => {
  const parsed = querySchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(400).json({
      error: "A valid userId is required",
      details: parsed.error.issues,
    });
  }

  try {
    const { userId } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { settings: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const timezone = user.settings?.timezone || "Asia/Kolkata";

    // Validate the configured timezone before formatting dates.
    new Intl.DateTimeFormat("en-US", { timeZone: timezone });

    const reviews = await prisma.review.findMany({
      where: { userId },
      select: { reviewedAt: true },
      orderBy: { reviewedAt: "desc" },
    });

    const today = getDateKey(new Date(), timezone);
    const dailyCounts = {};

    for (let offset = 29; offset >= 0; offset -= 1) {
      dailyCounts[shiftDateKey(today, -offset)] = 0;
    }

    let reviewsToday = 0;
    const reviewedDays = new Set();

    for (const review of reviews) {
      const dateKey = getDateKey(review.reviewedAt, timezone);

      reviewedDays.add(dateKey);

      if (dateKey === today) {
        reviewsToday += 1;
      }

      if (Object.hasOwn(dailyCounts, dateKey)) {
        dailyCounts[dateKey] += 1;
      }
    }

    let currentStreak = 0;
    let streakDate = reviewedDays.has(today)
      ? today
      : shiftDateKey(today, -1);

    while (reviewedDays.has(streakDate)) {
      currentStreak += 1;
      streakDate = shiftDateKey(streakDate, -1);
    }

    const last30Days = Object.entries(dailyCounts).map(
      ([date, count]) => ({ date, count })
    );

    res.json({
      totalReviews: reviews.length,
      reviewsToday,
      currentStreak,
      timezone,
      last30Days,
    });
  } catch (error) {
    console.error("Failed to fetch statistics:", error.message);

    res.status(500).json({
      error: "Failed to fetch statistics",
    });
  }
});

module.exports = router;
