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

/**
 * Assigns labels to anchor elements. When uniqueLabels is false, elements that
 * share the same href receive the same label; otherwise every element gets a
 * distinct label.
 */
export function assignLabels(
  elements: HTMLAnchorElement[],
  uniqueLabels: boolean,
): string[] {
  if (uniqueLabels) {
    return generateLabels(elements.length);
  }

  // Non-unique mode: collect distinct hrefs in first-seen order
  const hrefToLabel = new Map<string, string>();
  for (const el of elements) {
    if (!hrefToLabel.has(el.href)) {
      hrefToLabel.set(el.href, '');
    }
  }
  // Assign sequential labels to each distinct href
  const distinctLabels = generateLabels(hrefToLabel.size);
  let i = 0;
  for (const href of hrefToLabel.keys()) {
    hrefToLabel.set(href, distinctLabels[i++]);
  }

  return elements.map((el) => hrefToLabel.get(el.href)!);
}
