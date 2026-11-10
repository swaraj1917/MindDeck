
const express = require("express");
const { z } = require("zod");
const prisma = require("../prisma");

const router = express.Router();

const createCardSchema = z.object({
  question: z.string().trim().min(1).max(1000),
  options: z.array(z.string().trim().min(1).max(300)).min(2).max(6),
  correctAnswer: z.string().trim().min(1),
  explanation: z.string().trim().max(1000).optional(),
  deckId: z.string().min(1),
});

router.get("/", async (req, res) => {
  const deckId = req.query.deckId;

  if (!deckId || typeof deckId !== "string") {
    return res.status(400).json({ error: "A deckId is required" });
  }

  try {
    const cards = await prisma.card.findMany({
      where: { deckId },
      orderBy: { createdAt: "asc" },
    });

    res.json(cards);
  } catch (error) {
    console.error("Failed to fetch cards:", error.message);
    res.status(500).json({ error: "Failed to fetch cards" });
  }
});

router.post("/", async (req, res) => {
  const result = createCardSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: "Invalid card details",
      details: result.error.issues,
    });
  }

  const { deckId, options, correctAnswer, ...cardData } = result.data;

  if (!options.includes(correctAnswer)) {
    return res.status(400).json({
      error: "The correct answer must match one of the options",
    });
  }

  try {
    const deck = await prisma.deck.findUnique({
      where: { id: deckId },
    });

    if (!deck) {
      return res.status(404).json({ error: "Deck not found" });
    }

    const card = await prisma.card.create({
      data: {
        ...cardData,
        options,
        correctAnswer,
        deckId,
      },
    });

    res.status(201).json(card);
  } catch (error) {
    console.error("Failed to create card:", error.message);
    res.status(500).json({ error: "Failed to create card" });
  }
});

module.exports = router;
