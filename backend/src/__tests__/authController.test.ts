import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { login, register } from '../controllers/authController';
import prisma from '../lib/prisma';
import { createMockResponse } from './helpers';

vi.mock('bcryptjs', () => ({
  default: { compare: vi.fn(), hash: vi.fn() },
}));

vi.mock('jsonwebtoken', () => ({
  default: { sign: vi.fn() },
}));

vi.mock('../lib/prisma', () => ({
  default: {
    user: { findUnique: vi.fn(), create: vi.fn() },
  },
}));

const mockedCompare = vi.mocked(bcrypt.compare);
const mockedHash = vi.mocked(bcrypt.hash);
const mockedSign = vi.mocked(jwt.sign);
const mockedFindUnique = vi.mocked(prisma.user.findUnique);
const mockedCreate = vi.mocked(prisma.user.create);

const makeReq = (body: Record<string, unknown>): Request =>
  ({ body } as Request);

const dbUser = {
  id: 'u1',
  email: 'a@example.com',
  name: 'Alice',
  password: 'hashed',
  role: 'Admin',
  tenantId: 't1',
};

describe('authController.login', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when the user does not exist', async () => {
    mockedFindUnique.mockResolvedValue(null as never);
    const res = createMockResponse();
    await login(makeReq({ email: 'x@example.com', password: 'p' }), res);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ message: 'Invalid credentials' });
  });

  it('returns 401 when the password is wrong', async () => {
    mockedFindUnique.mockResolvedValue(dbUser as never);
    mockedCompare.mockResolvedValue(false as never);
    const res = createMockResponse();
    await login(makeReq({ email: dbUser.email, password: 'wrong' }), res);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ message: 'Invalid credentials' });
  });

  it('returns a token and sanitized user on success', async () => {
    mockedFindUnique.mockResolvedValue(dbUser as never);
    mockedCompare.mockResolvedValue(true as never);
    mockedSign.mockReturnValue('signed.jwt' as never);
    const res = createMockResponse();
    await login(makeReq({ email: dbUser.email, password: 'right' }), res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      token: 'signed.jwt',
      user: {
        id: 'u1',
        email: 'a@example.com',
        name: 'Alice',
        role: 'Admin',
        tenantId: 't1',
      },
    });
    // password must never be leaked
    expect(JSON.stringify(res.body)).not.toContain('hashed');
  });

  it('returns 500 when the lookup throws', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockedFindUnique.mockRejectedValue(new Error('db down'));
    const res = createMockResponse();
    await login(makeReq({ email: dbUser.email, password: 'p' }), res);

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ message: 'Server error' });
  });
});

describe('authController.register', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects a duplicate email with 400', async () => {
    mockedFindUnique.mockResolvedValue(dbUser as never);
    const res = createMockResponse();
    await register(makeReq({ email: dbUser.email, password: 'p', name: 'A' }), res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ message: 'User already exists' });
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it('creates a hashed user plus workspace on success', async () => {
    mockedFindUnique.mockResolvedValue(null as never);
    mockedHash.mockResolvedValue('hashed-pw' as never);
    mockedCreate.mockResolvedValue({
      ...dbUser,
      password: 'hashed-pw',
      tenant: { name: "Alice's Company" },
    } as never);
    const res = createMockResponse();
    await register(makeReq({ email: dbUser.email, password: 'secret', name: 'Alice' }), res);

    expect(mockedHash).toHaveBeenCalledWith('secret', 10);
    const createArg = mockedCreate.mock.calls[0][0] as {
      data: { password: string; role: string; tenant: { create: { name: string } } };
    };
    expect(createArg.data.password).toBe('hashed-pw');
    expect(createArg.data.role).toBe('admin');
    expect(createArg.data.tenant.create.name).toBe("Alice's Company");

    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject({
      message: 'User and workspace created successfully',
      user: { email: 'a@example.com', tenantName: "Alice's Company" },
    });
  });

  it('honors an explicit role and company name', async () => {
    mockedFindUnique.mockResolvedValue(null as never);
    mockedHash.mockResolvedValue('hashed-pw' as never);
    mockedCreate.mockResolvedValue({
      ...dbUser,
      role: 'HR',
      tenant: { name: 'Acme' },
    } as never);
    const res = createMockResponse();
    await register(
      makeReq({ email: dbUser.email, password: 'p', name: 'Alice', role: 'HR', companyName: 'Acme' }),
      res
    );

    const createArg = mockedCreate.mock.calls[0][0] as {
      data: { role: string; tenant: { create: { name: string } } };
    };
    expect(createArg.data.role).toBe('HR');
    expect(createArg.data.tenant.create.name).toBe('Acme');
    expect(res.statusCode).toBe(201);
  });

  it('returns 500 when creation throws', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockedFindUnique.mockResolvedValue(null as never);
    mockedHash.mockResolvedValue('hashed-pw' as never);
    mockedCreate.mockRejectedValue(new Error('db down'));
    const res = createMockResponse();
    await register(makeReq({ email: dbUser.email, password: 'p', name: 'A' }), res);

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ message: 'Server error' });
  });
});
