import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate, type AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { createMockResponse } from './helpers';

vi.mock('jsonwebtoken', () => ({
  default: { verify: vi.fn() },
}));

vi.mock('../lib/prisma', () => ({
  default: { tenant: { findUnique: vi.fn() } },
}));

const mockedVerify = vi.mocked(jwt.verify);
const mockedFindUnique = vi.mocked(prisma.tenant.findUnique);

const makeReq = (authorization?: string): AuthRequest =>
  ({ headers: authorization ? { authorization } : {} } as AuthRequest);

const decoded = {
  userId: 'u1',
  email: 'a@example.com',
  role: 'Admin',
  tenantId: 't1',
};

describe('authenticate middleware', () => {
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    next = vi.fn();
  });

  it('rejects a request without an Authorization header', async () => {
    const res = createMockResponse();
    await authenticate(makeReq(), res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ message: 'Authentication required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects a header that is not a Bearer token', async () => {
    const res = createMockResponse();
    await authenticate(makeReq('Basic abc'), res, next);

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects when the token is invalid', async () => {
    mockedVerify.mockImplementation(() => {
      throw new Error('bad token');
    });
    const res = createMockResponse();
    await authenticate(makeReq('Bearer bad'), res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ message: 'Invalid or expired token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects when the tenant no longer exists', async () => {
    mockedVerify.mockReturnValue(decoded as never);
    mockedFindUnique.mockResolvedValue(null as never);
    const res = createMockResponse();
    await authenticate(makeReq('Bearer good'), res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({
      message: 'Session invalid: workspace no longer exists',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('populates req.user and calls next for a valid token', async () => {
    mockedVerify.mockReturnValue(decoded as never);
    mockedFindUnique.mockResolvedValue({ id: 't1' } as never);
    const req = makeReq('Bearer good');
    const res = createMockResponse();
    await authenticate(req, res, next);

    expect(mockedFindUnique).toHaveBeenCalledWith({ where: { id: 't1' } });
    expect(req.user).toEqual(decoded);
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });
});
