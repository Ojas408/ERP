import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logActivity } from '../utils/audit';
import prisma from '../lib/prisma';

vi.mock('../lib/prisma', () => ({
  default: { auditLog: { create: vi.fn() } },
}));

const mockedCreate = vi.mocked(prisma.auditLog.create);

describe('logActivity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('persists an audit log entry with the provided fields', async () => {
    mockedCreate.mockResolvedValue({} as never);

    await logActivity('u1', 'a@example.com', 't1', 'CREATE', 'employee', 'added row');

    expect(mockedCreate).toHaveBeenCalledWith({
      data: {
        userId: 'u1',
        userEmail: 'a@example.com',
        tenantId: 't1',
        action: 'CREATE',
        entity: 'employee',
        details: 'added row',
      },
    });
  });

  it('passes undefined details through when omitted', async () => {
    mockedCreate.mockResolvedValue({} as never);

    await logActivity('u1', 'a@example.com', 't1', 'DELETE', 'vendor');

    expect(mockedCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ details: undefined }),
    });
  });

  it('swallows persistence errors instead of throwing', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockedCreate.mockRejectedValue(new Error('db down'));

    await expect(
      logActivity('u1', 'a@example.com', 't1', 'UPDATE', 'site')
    ).resolves.toBeUndefined();

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
