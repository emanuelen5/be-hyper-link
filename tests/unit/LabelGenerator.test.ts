import { describe, it, expect } from 'vitest';
import {
  assignLabels,
  generateLabels,
  labelsMatch,
} from '../../src/content/LabelGenerator';
import { filterLabels } from '../../src/utils/label-utils';

describe('generateLabels', () => {
  it('generates single-letter labels for the first 26', () => {
    const labels = generateLabels(26);
    expect(labels[0]).toBe('a');
    expect(labels[25]).toBe('z');
  });

  it('generates two-letter labels after 26', () => {
    const labels = generateLabels(28);
    expect(labels[26]).toBe('aa');
    expect(labels[27]).toBe('ab');
  });

  it('label at index 51 is az', () => {
    const labels = generateLabels(52);
    expect(labels[51]).toBe('az');
  });

  it('label at index 52 is ba', () => {
    const labels = generateLabels(53);
    expect(labels[52]).toBe('ba');
  });

  it('generates the correct count', () => {
    const labels = generateLabels(100);
    expect(labels).toHaveLength(100);
  });

  it('all labels are unique', () => {
    const labels = generateLabels(200);
    const unique = new Set(labels);
    expect(unique.size).toBe(200);
  });
});

describe('labelsMatch', () => {
  it('matches when label starts with typed', () => {
    expect(labelsMatch('abc', 'ab')).toBe(true);
    expect(labelsMatch('a', 'a')).toBe(true);
  });

  it('does not match when label does not start with typed', () => {
    expect(labelsMatch('abc', 'b')).toBe(false);
    expect(labelsMatch('a', 'b')).toBe(false);
  });

  it('always matches empty typed string', () => {
    expect(labelsMatch('abc', '')).toBe(true);
  });
});

describe('filterLabels', () => {
  const items = [
    { label: 'a', value: 1 },
    { label: 'ab', value: 2 },
    { label: 'b', value: 3 },
    { label: 'ba', value: 4 },
  ];

  it('returns all items when typed is empty', () => {
    expect(filterLabels(items, '')).toHaveLength(4);
  });

  it('filters to matching labels only', () => {
    const result = filterLabels(items, 'a');
    expect(result).toHaveLength(2);
    expect(result.map((i) => i.label)).toEqual(['a', 'ab']);
  });

  it('returns empty array when nothing matches', () => {
    expect(filterLabels(items, 'z')).toHaveLength(0);
  });

  it('handles exact match', () => {
    const result = filterLabels(items, 'ba');
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe('ba');
  });
});

function makeAnchors(hrefs: string[]): HTMLAnchorElement[] {
  return hrefs.map((href) => {
    const a = document.createElement('a') as HTMLAnchorElement;
    // jsdom resolves relative URLs, so use absolute hrefs to keep tests simple
    Object.defineProperty(a, 'href', { value: href, writable: false });
    return a;
  });
}

describe('assignLabels', () => {
  it('unique mode: assigns sequential labels like generateLabels', () => {
    const anchors = makeAnchors([
      'https://a.com',
      'https://b.com',
      'https://c.com',
    ]);
    const labels = assignLabels(anchors, true);
    expect(labels).toEqual(['a', 'b', 'c']);
  });

  it('unique mode: all labels are distinct', () => {
    const anchors = makeAnchors([
      'https://a.com',
      'https://b.com',
      'https://a.com',
    ]);
    const labels = assignLabels(anchors, true);
    expect(labels).toEqual(['a', 'b', 'c']);
  });

  it('non-unique mode: same href gets the same label', () => {
    const anchors = makeAnchors([
      'https://a.com',
      'https://b.com',
      'https://a.com',
    ]);
    const labels = assignLabels(anchors, false);
    expect(labels[0]).toBe(labels[2]);
    expect(labels[0]).not.toBe(labels[1]);
  });

  it('non-unique mode: labels are assigned in first-seen href order', () => {
    const anchors = makeAnchors([
      'https://x.com',
      'https://y.com',
      'https://x.com',
      'https://z.com',
    ]);
    const labels = assignLabels(anchors, false);
    expect(labels).toEqual(['a', 'b', 'a', 'c']);
  });

  it('non-unique mode: all distinct hrefs still get distinct labels', () => {
    const anchors = makeAnchors([
      'https://a.com',
      'https://b.com',
      'https://c.com',
    ]);
    const labels = assignLabels(anchors, false);
    expect(new Set(labels).size).toBe(3);
  });

  it('non-unique mode: empty input returns empty array', () => {
    expect(assignLabels([], false)).toEqual([]);
  });
});
