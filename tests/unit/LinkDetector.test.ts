import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getVisibleLinks } from '../../src/content/LinkDetector';

function makeMockRect(overrides: Partial<DOMRect> = {}): DOMRect {
  return {
    top: 100,
    bottom: 120,
    left: 50,
    right: 150,
    width: 100,
    height: 20,
    x: 50,
    y: 100,
    toJSON: () => ({}),
    ...overrides,
  };
}

function createLink(
  href: string,
  rectOverrides: Partial<DOMRect> = {},
  styleOverrides: Partial<CSSStyleDeclaration> = {},
): HTMLAnchorElement {
  const a = document.createElement('a');
  a.href = href;
  a.textContent = href;
  document.body.appendChild(a);

  vi.spyOn(a, 'getBoundingClientRect').mockReturnValue(
    makeMockRect(rectOverrides),
  );
  vi.spyOn(window, 'getComputedStyle').mockReturnValue({
    display: 'block',
    visibility: 'visible',
    opacity: '1',
    ...styleOverrides,
  } as CSSStyleDeclaration);

  return a;
}

describe('getVisibleLinks', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
    Object.defineProperty(window, 'innerHeight', {
      value: 768,
      configurable: true,
    });
    Object.defineProperty(window, 'innerWidth', {
      value: 1024,
      configurable: true,
    });
  });

  it('returns visible links in the viewport', () => {
    createLink('https://example.com');
    const links = getVisibleLinks();
    expect(links.length).toBeGreaterThan(0);
  });

  it('excludes links with zero dimensions', () => {
    const a = document.createElement('a');
    a.href = 'https://example.com/zero';
    document.body.appendChild(a);
    vi.spyOn(a, 'getBoundingClientRect').mockReturnValue(
      makeMockRect({ width: 0, height: 0 }),
    );
    const links = getVisibleLinks();
    const found = links.find((l) => l.href.includes('zero'));
    expect(found).toBeUndefined();
  });

  it('excludes links outside the viewport', () => {
    const a = document.createElement('a');
    a.href = 'https://example.com/offscreen';
    document.body.appendChild(a);
    vi.spyOn(a, 'getBoundingClientRect').mockReturnValue(
      makeMockRect({ top: 900, bottom: 920 }),
    );
    const links = getVisibleLinks();
    const found = links.find((l) => l.href.includes('offscreen'));
    expect(found).toBeUndefined();
  });
});
