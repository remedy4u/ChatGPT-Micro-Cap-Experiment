import { describe, it, expect } from 'vitest';
import { canTransition } from './jobs.js';

describe('job transitions', () => {
  it('allows valid transition path', () => {
    expect(canTransition('queued', 'processing')).toBe(true);
    expect(canTransition('processing', 'succeeded')).toBe(true);
  });

  it('blocks invalid transitions', () => {
    expect(canTransition('queued', 'succeeded')).toBe(false);
    expect(canTransition('succeeded', 'processing')).toBe(false);
  });
});
