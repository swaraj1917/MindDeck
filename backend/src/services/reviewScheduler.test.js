
import { describe, it, expect } from "vitest";
const { scheduleReview } = require("./reviewScheduler");

const baseCard = {
  repetitions: 0,
  intervalDays: 0,
  easeFactor: 2.5,
};

const testDate = new Date("2026-11-01T12:00:00");

function expectedDate(days) {
  const date = new Date(testDate);
  date.setDate(date.getDate() + days);
  return date;
}

describe("Review scheduler", () => {
  it("resets repetitions when rating AGAIN", () => {
    const result = scheduleReview(
      { ...baseCard, repetitions: 3, intervalDays: 10 },
      "AGAIN",
      testDate
    );

    expect(result.repetitions).toBe(0);
    expect(result.intervalDays).toBe(1);
    expect(result.easeFactor).toBe(2.3);
  });

  it("schedules the first HARD review after one day", () => {
    const result = scheduleReview(baseCard, "HARD", testDate);

    expect(result.repetitions).toBe(1);
    expect(result.intervalDays).toBe(1);
    expect(result.easeFactor).toBe(2.35);
  });

  it("schedules the first GOOD review after one day", () => {
    const result = scheduleReview(baseCard, "GOOD", testDate);

    expect(result.repetitions).toBe(1);
    expect(result.intervalDays).toBe(1);
  });

  it("schedules the second GOOD review after three days", () => {
    const result = scheduleReview(
      { ...baseCard, repetitions: 1, intervalDays: 1 },
      "GOOD",
      testDate
    );

    expect(result.repetitions).toBe(2);
    expect(result.intervalDays).toBe(3);
  });

  it("uses the ease factor for later GOOD reviews", () => {
    const result = scheduleReview(
      { ...baseCard, repetitions: 2, intervalDays: 3 },
      "GOOD",
      testDate
    );

    expect(result.repetitions).toBe(3);
    expect(result.intervalDays).toBe(8);
  });

  it("schedules the first EASY review after four days", () => {
    const result = scheduleReview(baseCard, "EASY", testDate);

    expect(result.repetitions).toBe(1);
    expect(result.intervalDays).toBe(4);
    expect(result.easeFactor).toBe(2.65);
  });

  it("calculates the next review date correctly", () => {
    const result = scheduleReview(baseCard, "GOOD", testDate);

    expect(result.nextReviewAt).toEqual(expectedDate(1));
    expect(result.lastReviewedAt).toEqual(testDate);
  });

  it("rejects an invalid rating", () => {
    expect(() =>
      scheduleReview(baseCard, "INVALID", testDate)
    ).toThrow("Invalid review rating");
  });
});
