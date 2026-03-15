import { labelsMatch } from '../utils/label-utils';

export { labelsMatch };

const CHARS = 'abcdefghijklmnopqrstuvwxyz';

/**
 * Generates labels like: a, b, ..., z, aa, ab, ..., az, ba, ...
 */
export function generateLabels(count: number): string[] {
  const labels: string[] = [];
  let n = 0;
  while (labels.length < count) {
    labels.push(toLabel(n, CHARS));
    n++;
  }
  return labels;
}

function toLabel(n: number, chars: string): string {
  const len = chars.length;
  if (n < len) return chars[n];
  return toLabel(Math.floor(n / len) - 1, chars) + chars[n % len];
}
