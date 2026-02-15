import { describe, it, expect } from 'vitest';
import { buildProviderPayload } from './presets.js';

describe('preset mapping', () => {
  it('maps wrap preset into provider payload', () => {
    const payload = buildProviderPayload('wrap', { preset: 'nardo gray', finish: 'matte' }, { sourceImageKey: 'x', variants: 6, hd: false });
    expect(payload.maskHint).toBe('car_body');
    expect(payload.prompt).toContain('nardo gray');
    expect(payload.negativePrompt).toContain('Do not change car model');
  });
});
