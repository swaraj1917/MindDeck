const express = require('express');
const { z } = require('zod');
const prisma = require('../prisma');

const router = express.Router();

const cardFields = {
  question: z.string().trim().min(1).max(1000),
  options: z.array(z.string().trim().min(1).max(300)).min(2).max(6),
  correctAnswer: z.string().trim().min(1),
  explanation: z.string().trim().max(1000).optional(),
};

const createCardSchema = z.object({ ...cardFields, deckId: z.string().min(1) });
const updateCardSchema = z.object(cardFields).partial();

function optionsProblem(options, correctAnswer) {
  if (new Set(options).size !== options.length) {
    return 'Each option must be different';
  }

  if (!options.includes(correctAnswer)) {
    return 'The correct answer must match one of the options';
  }

  return null;
}

router.get('/', async (req, res) => {
  const deckId = req.query.deckId;

  if (!deckId || typeof deckId !== 'string') {
    return res.status(400).json({ error: 'A deckId is required' });
  }

  try {
    const deck = await prisma.deck.findFirst({
      where: { id: deckId, userId: req.userId },
    });

    if (!deck) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    const cards = await prisma.card.findMany({
      where: { deckId },
      orderBy: { createdAt: 'asc' },
    });

    res.json(cards);
  } catch (error) {
    console.error('Failed to fetch cards:', error.message);
    res.status(500).json({ error: 'Failed to fetch cards' });
  }
});

router.post('/', async (req, res) => {
  const result = createCardSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: 'Invalid card details',
      details: result.error.issues,
    });
  }

  const { deckId, ...cardData } = result.data;
  const problem = optionsProblem(cardData.options, cardData.correctAnswer);

  if (problem) {
    return res.status(400).json({ error: problem });
  }

  try {
    const deck = await prisma.deck.findFirst({
      where: { id: deckId, userId: req.userId },
    });

    if (!deck) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    const card = await prisma.card.create({ data: { ...cardData, deckId } });
    res.status(201).json(card);
  } catch (error) {
    console.error('Failed to create card:', error.message);
    res.status(500).json({ error: 'Failed to create card' });
  }
});

router.patch('/:id', async (req, res) => {
  const result = updateCardSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: 'Invalid card details',
      details: result.error.issues,
    });
  }

  try {
    const card = await prisma.card.findFirst({
      where: { id: req.params.id, deck: { userId: req.userId } },
    });

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    const options = result.data.options ?? card.options;
    const correctAnswer = result.data.correctAnswer ?? card.correctAnswer;
    const problem = optionsProblem(options, correctAnswer);

    if (problem) {
      return res.status(400).json({ error: problem });
    }

    const updated = await prisma.card.update({
      where: { id: card.id },
      data: result.data,
    });

    res.json(updated);
  } catch (error) {
    console.error('Failed to update card:', error.message);
    res.status(500).json({ error: 'Failed to update card' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const card = await prisma.card.findFirst({
      where: { id: req.params.id, deck: { userId: req.userId } },
    });

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    await prisma.card.delete({ where: { id: card.id } });
    res.status(204).end();
  } catch (error) {
    console.error('Failed to delete card:', error.message);
    res.status(500).json({ error: 'Failed to delete card' });
  }
});

module.exports = router;