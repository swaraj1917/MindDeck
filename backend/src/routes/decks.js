const express = require('express');
const { z } = require('zod');
const prisma = require('../prisma');

const router = express.Router();

const deckSchema = z.object({
  name: z.string().trim().min(1, 'Deck name is required').max(100),
  description: z.string().trim().max(500).optional(),
});

router.get('/', async (req, res) => {
  try {
    const decks = await prisma.deck.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { cards: true } } },
    });

    res.json(decks);
  } catch (error) {
    console.error('Failed to fetch decks:', error.message);
    res.status(500).json({ error: 'Failed to fetch decks' });
  }
});

router.post('/', async (req, res) => {
  const result = deckSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: 'Invalid deck details',
      details: result.error.issues,
    });
  }

  try {
    const deck = await prisma.deck.create({
      data: { ...result.data, userId: req.userId },
    });

    res.status(201).json(deck);
  } catch (error) {
    console.error('Failed to create deck:', error.message);
    res.status(500).json({ error: 'Failed to create deck' });
  }
});

router.patch('/:id', async (req, res) => {
  const result = deckSchema.partial().safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: 'Invalid deck details',
      details: result.error.issues,
    });
  }

  if (Object.keys(result.data).length === 0) {
    return res.status(400).json({ error: 'Nothing to update' });
  }

  try {
    const { count } = await prisma.deck.updateMany({
      where: { id: req.params.id, userId: req.userId },
      data: result.data,
    });

    if (count === 0) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    const deck = await prisma.deck.findUnique({ where: { id: req.params.id } });
    res.json(deck);
  } catch (error) {
    console.error('Failed to update deck:', error.message);
    res.status(500).json({ error: 'Failed to update deck' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { count } = await prisma.deck.deleteMany({
      where: { id: req.params.id, userId: req.userId },
    });

    if (count === 0) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    res.status(204).end();
  } catch (error) {
    console.error('Failed to delete deck:', error.message);
    res.status(500).json({ error: 'Failed to delete deck' });
  }
});

module.exports = router;