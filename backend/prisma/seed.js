const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

const DEMO_EMAIL = 'demo@minddeck.local';
const DEMO_PASSWORD = 'Demo@1234';

const sampleCards = [
  {
    question: 'Which keyword declares a block-scoped variable?',
    options: ['var', 'let', 'function', 'define'],
    correctAnswer: 'let',
    explanation: 'let (and const) are block-scoped. var is function-scoped.',
  },
  {
    question: 'What does === check?',
    options: ['Value only', 'Type only', 'Value and type', 'Reference only'],
    correctAnswer: 'Value and type',
    explanation: 'Strict equality compares both value and type, with no coercion.',
  },
  {
    question: 'What does Array.prototype.map return?',
    options: ['A new array', 'The original array', 'undefined', 'A single value'],
    correctAnswer: 'A new array',
    explanation: 'map builds a new array from the callback results.',
  },
  {
    question: 'Which method turns JSON text into an object?',
    options: ['JSON.parse()', 'JSON.stringify()', 'JSON.object()', 'JSON.decode()'],
    correctAnswer: 'JSON.parse()',
    explanation: 'JSON.stringify does the opposite: object to text.',
  },
];

async function main() {
  const password = await bcrypt.hash(DEMO_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { password },
    create: {
      name: 'Demo User',
      email: DEMO_EMAIL,
      password,
      settings: { create: {} },
    },
  });

  const existing = await prisma.deck.findFirst({
    where: { userId: user.id, name: 'JavaScript Basics' },
  });

  if (!existing) {
    await prisma.deck.create({
      data: {
        name: 'JavaScript Basics',
        description: 'Core JavaScript concepts to get you started.',
        userId: user.id,
        cards: { create: sampleCards },
      },
    });
  }

  console.log(`Demo user ready: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });