
const express = require("express");
const { z } = require("zod");
const prisma = require("../prisma");

const router = express.Router();

const createDeckSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).optional(),
  userId: z.string().min(1),
});

router.get("/", async (req, res) => {
  try {
    const decks = await prisma.deck.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { cards: true },
        },
      },
    });

    res.json(decks);
  } catch (error) {
    console.error("Failed to fetch decks:", error.message);
    res.status(500).json({ error: "Failed to fetch decks" });
  }
});

router.post("/", async (req, res) => {
  const result = createDeckSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: "Invalid deck details",
      details: result.error.issues,
    });
  }

  try {
    const deck = await prisma.deck.create({
      data: result.data,
    });

    res.status(201).json(deck);
  } catch (error) {
    if (error.code === "P2003") {
      return res.status(400).json({ error: "User does not exist" });
    }

    console.error("Failed to create deck:", error.message);
    res.status(500).json({ error: "Failed to create deck" });
  }
});

module.exports = router;
