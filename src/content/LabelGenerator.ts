const CHARS = 'abcdefghijklmnopqrstuvwxyz';

/**
 * Generates prefix-free labels of uniform length.
 * For count ≤ 26: a, b, ..., z
 * For count ≤ 676: aa, ab, ..., zz
 * For count ≤ 17576: aaa, aab, ..., zzz
 * etc.
 */
export function generateLabels(count: number): string[] {
  if (count === 0) return [];
  const len = labelLength(count);
  const labels: string[] = [];
  for (let i = 0; i < count; i++) {
    labels.push(toLabel(i, len));
  }
  return labels;
}

function labelLength(count: number): number {
  let len = 1;
  let capacity = CHARS.length;
  while (capacity < count) {
    len++;
    capacity = CHARS.length ** len;
  }
  return len;
}

function toLabel(n: number, length: number): string {
  let result = '';
  for (let i = length - 1; i >= 0; i--) {
    result = CHARS[n % CHARS.length] + result;
    n = Math.floor(n / CHARS.length);
  }
  return result;
}
