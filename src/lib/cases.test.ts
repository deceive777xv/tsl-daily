import { describe, expect, it } from 'vitest';

import { caseSlug, uniqueTags } from './cases';

describe('case content helpers', () => {
  it('maps an Astro content id to a stable case slug', () => {
    expect(caseSlug({ id: 'quiet-orbit/index' } as never)).toBe('quiet-orbit');
  });

  it('deduplicates and sorts controlled tags', () => {
    const entries = [
      { data: { tags: ['SDF', 'Color'] } },
      { data: { tags: ['Noise', 'SDF'] } },
    ] as never;

    expect(uniqueTags(entries)).toEqual(['Color', 'Noise', 'SDF']);
  });
});
