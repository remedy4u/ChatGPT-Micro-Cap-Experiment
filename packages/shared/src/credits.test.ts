import { describe, it, expect } from 'vitest';
import { chargeCreditsOnce, LedgerRepo } from './credits.js';

describe('chargeCreditsOnce', () => {
  it('charges only once by idempotency key', async () => {
    const keys = new Set<string>();
    const repo: LedgerRepo = {
      hasEntryByKey: async (k) => keys.has(k),
      insertEntry: async (e) => {
        keys.add(e.idempotencyKey);
      }
    };

    const first = await chargeCreditsOnce(repo, { userId: 'u1', delta: -1, reason: 'job', idempotencyKey: 'abc' });
    const second = await chargeCreditsOnce(repo, { userId: 'u1', delta: -1, reason: 'job', idempotencyKey: 'abc' });

    expect(first).toBe(true);
    expect(second).toBe(false);
  });
});
