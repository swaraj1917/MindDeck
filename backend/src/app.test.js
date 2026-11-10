
import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "./app";

describe("MindDeck API", () => {
  it("returns the API running message", async () => {
    const response = await request(app).get("/");
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("MindDeck API is running");
  });

  it("returns a healthy backend status", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(response.body.message).toBe("MindDeck backend is healthy");
  });

  it("rejects deck creation with invalid details", async () => {
    const response = await request(app).post("/api/decks").send({});
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid deck details");
  });

  it("rejects card creation with invalid details", async () => {
    const response = await request(app).post("/api/cards").send({});
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid card details");
  });

  it("rejects card requests without a deckId", async () => {
    const response = await request(app).get("/api/cards");
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("A deckId is required");
  });

  it("rejects reviews with invalid details", async () => {
    const response = await request(app).post("/api/reviews").send({});
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid review details");
  });

  it("rejects study queue requests without a userId", async () => {
    const response = await request(app).get("/api/study/due");
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("A valid userId is required");
  });

  it("rejects statistics requests without a userId", async () => {
    const response = await request(app).get("/api/stats");
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("A valid userId is required");
  });
});
