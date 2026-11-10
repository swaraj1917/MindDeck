import { describe, it, expect } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from './app';

const token = jwt.sign({ sub: 'test-user' }, process.env.JWT_SECRET);
const authHeader = { Authorization: `Bearer ${token}` };

describe('public endpoints', () => {
  it('returns the API running message', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('MindDeck API is running');
  });

  it('returns a healthy backend status', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });
});

describe('authentication is required', () => {
  const protectedRoutes = [
    ['get', '/api/decks'],
    ['post', '/api/decks'],
    ['get', '/api/cards?deckId=abc'],
    ['post', '/api/cards'],
    ['post', '/api/reviews'],
    ['get', '/api/study/due'],
    ['get', '/api/stats'],
  ];

  it.each(protectedRoutes)('rejects %s %s without a token', async (method, url) => {
    const response = await request(app)[method](url);
    expect(response.status).toBe(401);
  });

  it('rejects a token signed with the wrong secret', async () => {
    const forged = jwt.sign({ sub: 'test-user' }, 'wrong-secret');
    const response = await request(app)
      .get('/api/decks')
      .set('Authorization', `Bearer ${forged}`);
    expect(response.status).toBe(401);
  });
});

describe('input validation', () => {
  it('rejects registration with a short password', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', email: 'test@example.com', password: 'short' });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid registration details');
  });

  it('rejects registration with an invalid email', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', email: 'not-an-email', password: 'password123' });
    expect(response.status).toBe(400);
  });

  it('rejects login without a password', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com' });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid login details');
  });

  it('rejects deck creation with invalid details', async () => {
    const response = await request(app).post('/api/decks').set(authHeader).send({});
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid deck details');
  });

  it('rejects card creation with invalid details', async () => {
    const response = await request(app).post('/api/cards').set(authHeader).send({});
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid card details');
  });

  it('rejects a card whose correct answer is not one of the options', async () => {
    const response = await request(app)
      .post('/api/cards')
      .set(authHeader)
      .send({
        deckId: 'deck-1',
        question: 'Pick one',
        options: ['a', 'b'],
        correctAnswer: 'c',
      });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      'The correct answer must match one of the options'
    );
  });

  it('rejects card requests without a deckId', async () => {
    const response = await request(app).get('/api/cards').set(authHeader);
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('A deckId is required');
  });

  it('rejects reviews with invalid details', async () => {
    const response = await request(app).post('/api/reviews').set(authHeader).send({});
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid review details');
  });
});