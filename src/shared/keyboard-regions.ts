// Standard keyboard rows (QWERTY)
export const KEYBOARD_ROWS = [
  '1234567890', // top 25% of viewport
  'qwertyuiop', // 25-50%
  'asdfghjkl', // 50-75%
  'zxcvbnm', // 75-100%
];

export interface ScreenRegion {
  topFraction: number;
  bottomFraction: number;
  keys: string;
}

export function getRegions(): ScreenRegion[] {
  return KEYBOARD_ROWS.map((keys, i) => ({
    topFraction: i / KEYBOARD_ROWS.length,
    bottomFraction: (i + 1) / KEYBOARD_ROWS.length,
    keys,
  }));
}

export function getRegionForKey(key: string): ScreenRegion | null {
  const regions = getRegions();
  return regions.find((r) => r.keys.includes(key.toLowerCase())) ?? null;
}

export function getRegionLinks(
  links: HTMLElement[],
  region: ScreenRegion,
): HTMLElement[] {
  const viewportHeight = window.innerHeight;
  const top = region.topFraction * viewportHeight;
  const bottom = region.bottomFraction * viewportHeight;
  return links.filter((link) => {
    const rect = link.getBoundingClientRect();
    const centerY = rect.top + rect.height / 2;
    return centerY >= top && centerY < bottom;
  });
}
