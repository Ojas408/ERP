import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextFunction } from 'express';
import { authorize } from '../middleware/rbac';
import type { AuthRequest } from '../middleware/auth';
import { createMockResponse } from './helpers';

// auth.ts (imported transitively via rbac) pulls in the Prisma client; stub it out.
vi.mock('../lib/prisma', () => ({ default: {} }));

const makeReq = (
  user?: Partial<NonNullable<AuthRequest['user']>>,
  method = 'GET'
): AuthRequest =>
  ({
    method,
    user: user as AuthRequest['user'],
  } as AuthRequest);

describe('authorize middleware', () => {
  let next: NextFunction;

  beforeEach(() => {
    next = vi.fn();
  });

  it('rejects unauthenticated requests with 401', () => {
    const res = createMockResponse();
    authorize(['employees'])(makeReq(undefined), res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ message: 'Authentication required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('grants Super Admin access to any module', () => {
    const res = createMockResponse();
    authorize(['anything'])(makeReq({ role: 'Super Admin' }), res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('grants Admin access regardless of case', () => {
    const res = createMockResponse();
    authorize(['anything'])(makeReq({ role: 'admin' }), res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('allows a role that owns the requested module', () => {
    const res = createMockResponse();
    authorize(['payroll'])(makeReq({ role: 'HR' }), res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('forbids a role that does not own the requested module', () => {
    const res = createMockResponse();
    authorize(['expenses'])(makeReq({ role: 'HR' }), res, next);

    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ message: 'Forbidden: Insufficient privileges' });
    expect(next).not.toHaveBeenCalled();
  });

  it('blocks Viewer from non-GET requests', () => {
    const res = createMockResponse();
    authorize(['production'])(makeReq({ role: 'Viewer' }, 'POST'), res, next);

    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ message: 'Read-only access' });
    expect(next).not.toHaveBeenCalled();
  });

  it('allows Viewer to perform GET requests', () => {
    const res = createMockResponse();
    authorize(['production'])(makeReq({ role: 'Viewer' }, 'GET'), res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('forbids an unknown role', () => {
    const res = createMockResponse();
    authorize(['production'])(makeReq({ role: 'Ghost' }), res, next);

    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });
});
