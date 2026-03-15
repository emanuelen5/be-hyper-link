import { describe, it, expect } from 'vitest';
import { generateLabels, labelsMatch } from '../../src/content/LabelGenerator';
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
