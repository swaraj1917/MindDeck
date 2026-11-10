
const MIN_EASE_FACTOR = 1.3;

function scheduleReview(card, rating, now = new Date()) {
  const validRatings = ["AGAIN", "HARD", "GOOD", "EASY"];

  if (!validRatings.includes(rating)) {
    throw new Error("Invalid review rating");
  }

  let repetitions = card.repetitions;
  let intervalDays = card.intervalDays;
  let easeFactor = card.easeFactor;

  if (rating === "AGAIN") {
    repetitions = 0;
    intervalDays = 1;
    easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor - 0.2);
  } else if (rating === "HARD") {
    intervalDays = repetitions === 0
      ? 1
      : Math.max(1, Math.ceil(intervalDays * 1.2));
    easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor - 0.15);
    repetitions += 1;
  } else if (rating === "GOOD") {
    if (repetitions === 0) {
      intervalDays = 1;
    } else if (repetitions === 1) {
      intervalDays = 3;
    } else {
      intervalDays = Math.max(1, Math.ceil(intervalDays * easeFactor));
    }

    repetitions += 1;
  } else if (rating === "EASY") {
    intervalDays = repetitions === 0
      ? 4
      : Math.max(1, Math.ceil(intervalDays * easeFactor * 1.3));

    easeFactor += 0.15;
    repetitions += 1;
  }

  const nextReviewAt = new Date(now);
  nextReviewAt.setDate(nextReviewAt.getDate() + intervalDays);

  return {
    repetitions,
    intervalDays,
    easeFactor,
    nextReviewAt,
    lastReviewedAt: now,
  };
}

module.exports = { scheduleReview };
