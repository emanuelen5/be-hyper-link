import { describe, expect, it } from 'vitest';
import { generateLabels } from '../../src/content/LabelGenerator';
import { filterLabels, labelsMatch } from '../../src/utils/label-utils';

describe('generateLabels', () => {
  it('generates single-letter labels for up to 26', () => {
    const labels = generateLabels(26);
    expect(labels[0]).toBe('a');
    expect(labels[25]).toBe('z');
  });

  it('generates uniform two-letter labels when count exceeds 26', () => {
    const labels = generateLabels(28);
    expect(labels[0]).toBe('aa');
    expect(labels[1]).toBe('ab');
    expect(labels[26]).toBe('ba');
    expect(labels[27]).toBe('bb');
  });

  it('two-letter labels cover full range', () => {
    const labels = generateLabels(676);
    expect(labels[0]).toBe('aa');
    expect(labels[675]).toBe('zz');
  });

  it('generates three-letter labels when count exceeds 676', () => {
    const labels = generateLabels(677);
    expect(labels[0]).toBe('aaa');
    expect(labels[676]).toBe('baa');
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

  it('all labels have the same length (prefix-free)', () => {
    const labels = generateLabels(100);
    const lengths = new Set(labels.map((l) => l.length));
    expect(lengths.size).toBe(1);
  });

  it('returns empty array for count 0', () => {
    expect(generateLabels(0)).toEqual([]);
  });

  it('no label is a prefix of another (prefix-free property)', () => {
    for (const count of [10, 26, 27, 50]) {
      const labels = generateLabels(count);
      for (let i = 0; i < labels.length; i++) {
        for (let j = 0; j < labels.length; j++) {
          if (i !== j) {
            expect(
              labels[j].startsWith(labels[i]),
              `"${labels[i]}" is a prefix of "${labels[j]}" (count=${count})`,
            ).toBe(false);
          }
        }
      }
    }
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
