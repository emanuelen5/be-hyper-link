/**
 * Returns true if the label starts with the typed prefix.
 */
export function labelsMatch(label: string, typed: string): boolean {
  return label.startsWith(typed);
}

/**
 * Filters an array of labels to those matching the typed prefix.
 */
export function filterLabels<T extends { label: string }>(
  items: T[],
  typed: string,
): T[] {
  if (!typed) return items;
  return items.filter((item) => labelsMatch(item.label, typed));
}
