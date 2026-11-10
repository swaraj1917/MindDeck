import { describe, it, expect, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import auth from './auth';

const { requireAuth } = auth;

function run(headers = {}) {
  const req = { headers };
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  const next = vi.fn();

  requireAuth(req, res, next);
  return { req, res, next };
}

describe('requireAuth', () => {
  it('rejects a request with no Authorization header', () => {
    const { res, next } = run();
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects a header that is not a Bearer token', () => {
    const { res, next } = run({ authorization: 'Basic abc123' });
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects an expired token', () => {
    const expired = jwt.sign(
      { sub: 'user-1', exp: Math.floor(Date.now() / 1000) - 60 },
      process.env.JWT_SECRET
    );
    const { res, next } = run({ authorization: `Bearer ${expired}` });
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('accepts a valid token and sets req.userId', () => {
    const valid = jwt.sign({ sub: 'user-1' }, process.env.JWT_SECRET);
    const { req, next } = run({ authorization: `Bearer ${valid}` });
    expect(req.userId).toBe('user-1');
    expect(next).toHaveBeenCalledTimes(1);
  });
});