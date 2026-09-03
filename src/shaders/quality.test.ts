import { describe, expect, it } from 'vitest';

import { dprForMode, nextAutoDpr } from './quality';

describe('adaptive quality', () => {
  it('reduces DPR when frames remain over budget', () => {
    expect(nextAutoDpr(1, 24, 16.67, 1.5)).toBe(0.9);
  });

  it('never reduces DPR below the readability floor', () => {
    expect(nextAutoDpr(0.65, 48, 16.67, 1.5)).toBe(0.65);
  });

  it('caps explicit quality at the device DPR', () => {
    expect(dprForMode('high', 1.25, 1)).toBe(1.25);
  });
});
