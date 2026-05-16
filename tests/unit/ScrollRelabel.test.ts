import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { KeyboardHandler } from '../../src/content/KeyboardHandler';
import type { Settings } from '../../src/shared/types';
import { DEFAULT_SETTINGS } from '../../src/shared/types';

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

function mockVisible(el: HTMLElement, top = 100): void {
  vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(
    makeMockRect({ top, bottom: top + 20 }),
  );
}

function createLink(href: string, top = 100): HTMLAnchorElement {
  const a = document.createElement('a');
  a.href = href;
  a.textContent = href;
  document.body.appendChild(a);
  mockVisible(a, top);
  return a;
}

function pressKey(
  key: string,
  opts: Partial<KeyboardEventInit> = {},
): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...opts,
  });
  document.dispatchEvent(event);
  return event;
}

const settings: Settings = {
  ...DEFAULT_SETTINGS,
  trigger: { key: 'f', ctrl: false, alt: false, shift: false, meta: false },
  searchKey: '/',
  refreshLinksOnScroll: true,
};

describe('Scroll relabeling', () => {
  let handler: KeyboardHandler;

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
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      display: 'block',
      visibility: 'visible',
      opacity: '1',
    } as CSSStyleDeclaration);
  });

  afterEach(() => {
    handler.destroy();
  });

  it('relabels existing single-letter labels to two-letter when new links push count past 26', () => {
    // Start with 25 links (single-letter labels a-y)
    for (let i = 0; i < 25; i++) {
      createLink(`https://example.com/${i}`, 50 + i * 25);
    }

    handler = new KeyboardHandler(settings);

    // Activate
    pressKey('f');

    // Verify initial labels are single-letter
    const links = (handler as any).links;
    expect(links).toHaveLength(25);
    expect(links[0].label).toBe('a');
    expect(links[24].label).toBe('y');

    // Add 5 more links (simulating scroll revealing new content)
    for (let i = 0; i < 5; i++) {
      createLink(`https://example.com/new-${i}`, 100 + i * 25);
    }

    // Trigger scroll
    window.dispatchEvent(new Event('scroll'));

    // All 30 links should now have two-letter labels
    expect(links).toHaveLength(30);
    expect(links[0].label).toBe('aa');
    expect(links[1].label).toBe('ab');
    expect(links[24].label).toBe('ay');
    expect(links[25].label).toBe('az');
    expect(links[29].label).toBe('bd');
  });
});
