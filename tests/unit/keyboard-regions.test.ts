import { describe, it, expect } from 'vitest';
import {
  getRegions,
  getRegionForKey,
  KEYBOARD_ROWS,
} from '../../src/shared/keyboard-regions';

describe('getRegions', () => {
  it('returns one region per keyboard row', () => {
    const regions = getRegions();
    expect(regions).toHaveLength(KEYBOARD_ROWS.length);
  });

  it('covers the full viewport (0 to 1)', () => {
    const regions = getRegions();
    expect(regions[0].topFraction).toBe(0);
    expect(regions[regions.length - 1].bottomFraction).toBe(1);
  });

  it('regions are contiguous', () => {
    const regions = getRegions();
    for (let i = 1; i < regions.length; i++) {
      expect(regions[i].topFraction).toBe(regions[i - 1].bottomFraction);
    }
  });
});

describe('getRegionForKey', () => {
  it('returns the correct region for a key in row 2', () => {
    const region = getRegionForKey('q');
    expect(region).not.toBeNull();
    expect(region!.keys).toContain('q');
    expect(region!.topFraction).toBe(0.25);
  });

  it('returns the correct region for a key in row 3', () => {
    const region = getRegionForKey('a');
    expect(region).not.toBeNull();
    expect(region!.topFraction).toBe(0.5);
  });

  it('returns null for unknown keys', () => {
    const region = getRegionForKey('~');
    expect(region).toBeNull();
  });

  it('is case-insensitive', () => {
    const lower = getRegionForKey('q');
    const upper = getRegionForKey('Q');
    expect(lower).toEqual(upper);
  });
});
