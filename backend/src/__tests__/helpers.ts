import { vi } from 'vitest';
import type { Response } from 'express';

export interface MockResponse extends Response {
  statusCode: number;
  body: unknown;
}

/** Build a minimal Express Response whose status()/json() record what was sent. */
export const createMockResponse = (): MockResponse => {
  const res = {} as MockResponse;
  res.statusCode = 200;
  res.body = undefined;
  res.status = vi.fn((code: number) => {
    res.statusCode = code;
    return res;
  }) as unknown as Response['status'];
  res.json = vi.fn((payload: unknown) => {
    res.body = payload;
    return res;
  }) as unknown as Response['json'];
  return res;
};
