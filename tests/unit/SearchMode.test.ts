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

function createLink(href: string, text: string, top = 100): HTMLAnchorElement {
  const a = document.createElement('a');
  a.href = href;
  a.textContent = text;
  document.body.appendChild(a);
  vi.spyOn(a, 'getBoundingClientRect').mockReturnValue(
    makeMockRect({ top, bottom: top + 20 }),
  );
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
  triggerKey: 'f',
  searchKey: '/',
};

describe('Search Mode', () => {
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

    createLink('https://example.com/home', 'Home Page', 100);
    createLink('https://example.com/about', 'About Us', 200);
    createLink('https://example.com/contact', 'Contact Info', 300);

    handler = new KeyboardHandler(settings);
  });

  afterEach(() => {
    handler.destroy();
  });

  it('enters search mode when pressing / after activation', () => {
    pressKey('f'); // activate
    const event = pressKey('/'); // enter search mode
    // The event should be intercepted (preventDefault called)
    expect(event.defaultPrevented).toBe(true);
  });

  it('highlights single match green and requires Enter to follow', () => {
    const contactLink = document.querySelector<HTMLAnchorElement>(
      'a[href="https://example.com/contact"]',
    )!;
    const clickSpy = vi.spyOn(contactLink, 'click');

    pressKey('f'); // activate
    pressKey('/'); // enter search mode
    // Type "contact" — only "Contact Info" matches
    for (const ch of 'contact') {
      pressKey(ch);
    }
    // Should NOT auto-follow — needs confirmation
    expect(clickSpy).not.toHaveBeenCalled();
    // Press Enter to confirm
    pressKey('Enter');
    expect(clickSpy).toHaveBeenCalled();
  });

  it('enters selecting mode on Enter with multiple matches', () => {
    pressKey('f'); // activate
    pressKey('/'); // enter search mode
    // Type nothing, press Enter — all 3 links match, should not follow
    const homeLink = document.querySelector<HTMLAnchorElement>(
      'a[href="https://example.com/home"]',
    )!;
    const clickSpy = vi.spyOn(homeLink, 'click');
    pressKey('Enter');
    // Should enter search-selecting but not click yet
    expect(clickSpy).not.toHaveBeenCalled();
  });

  it('follows selected link after Tab + Enter in selecting mode', () => {
    const aboutLink = document.querySelector<HTMLAnchorElement>(
      'a[href="https://example.com/about"]',
    )!;
    const clickSpy = vi.spyOn(aboutLink, 'click');

    pressKey('f'); // activate
    pressKey('/'); // enter search mode
    pressKey('Enter'); // enter selecting mode (all links match)
    // Now at index 0 (Home Page). Tab to index 1 (About Us)
    pressKey('Tab');
    pressKey('Enter'); // follow
    expect(clickSpy).toHaveBeenCalled();
  });

  it('cycles selection with Shift+Tab', () => {
    const contactLink = document.querySelector<HTMLAnchorElement>(
      'a[href="https://example.com/contact"]',
    )!;
    const clickSpy = vi.spyOn(contactLink, 'click');

    pressKey('f'); // activate
    pressKey('/'); // enter search mode
    pressKey('Enter'); // enter selecting mode (index 0)
    // Shift+Tab wraps to last (index 2 = Contact Info)
    pressKey('Tab', { shiftKey: true });
    pressKey('Enter');
    expect(clickSpy).toHaveBeenCalled();
  });

  it('deactivates on Escape in search mode', () => {
    pressKey('f'); // activate
    pressKey('/'); // search mode
    pressKey('Escape'); // should deactivate

    // After deactivation, pressing regular keys should not be intercepted
    const event = pressKey('a');
    expect(event.defaultPrevented).toBe(false);
  });

  it('goes back to label mode on Backspace with empty query', () => {
    pressKey('f'); // activate
    pressKey('/'); // search mode
    pressKey('Backspace'); // empty query -> back to active

    // Now typing 'a' should work in label/sequential mode (intercept the event)
    const event = pressKey('a');
    expect(event.defaultPrevented).toBe(true);
  });

  it('narrows search results and highlights single match', () => {
    pressKey('f'); // activate
    pressKey('/'); // search mode
    // Type 'about' — narrows to "About Us"
    const aboutLink = document.querySelector<HTMLAnchorElement>(
      'a[href="https://example.com/about"]',
    )!;
    const clickSpy = vi.spyOn(aboutLink, 'click');
    for (const ch of 'about') {
      pressKey(ch);
    }
    // Single match: highlighted but not followed yet
    expect(clickSpy).not.toHaveBeenCalled();
    pressKey('Enter');
    expect(clickSpy).toHaveBeenCalled();
  });

  it('follows single match on Enter in search mode', () => {
    const homeLink = document.querySelector<HTMLAnchorElement>(
      'a[href="https://example.com/home"]',
    )!;
    const clickSpy = vi.spyOn(homeLink, 'click');

    pressKey('f'); // activate
    pressKey('/'); // search mode
    pressKey('h'); // "h" matches "Home Page"
    pressKey('o'); // "ho" matches only "Home Page" — highlighted green
    expect(clickSpy).not.toHaveBeenCalled();
    pressKey('Enter'); // confirm
    expect(clickSpy).toHaveBeenCalled();
  });

  it('search is case-insensitive', () => {
    pressKey('f');
    pressKey('/');
    // Type uppercase letters
    const aboutLink = document.querySelector<HTMLAnchorElement>(
      'a[href="https://example.com/about"]',
    )!;
    const clickSpy = vi.spyOn(aboutLink, 'click');
    for (const ch of 'ABOUT') {
      pressKey(ch);
    }
    // Single match highlighted, needs Enter
    expect(clickSpy).not.toHaveBeenCalled();
    pressKey('Enter');
    expect(clickSpy).toHaveBeenCalled();
  });

  it('Backspace in single-match selecting returns to search mode', () => {
    const homeLink = document.querySelector<HTMLAnchorElement>(
      'a[href="https://example.com/home"]',
    )!;
    const clickSpy = vi.spyOn(homeLink, 'click');

    pressKey('f'); // activate
    pressKey('/'); // search mode
    pressKey('h');
    pressKey('o'); // "ho" -> single match (Home Page), enters search-selecting
    expect(clickSpy).not.toHaveBeenCalled();
    // Backspace: deletes 'o', query='h', state=searching
    pressKey('Backspace');
    // Enter: query 'h' still has 1 match, enters search-selecting
    pressKey('Enter');
    // Enter: follows the selected link
    pressKey('Enter');
    expect(clickSpy).toHaveBeenCalled();
  });

  it('Backspace in multi-match selecting returns to search mode', () => {
    pressKey('f'); // activate
    pressKey('/'); // search mode
    pressKey('Enter'); // enter selecting with all 3 matches
    // Backspace should go back to search mode
    pressKey('Backspace');
    // Now we can type to narrow search
    const contactLink = document.querySelector<HTMLAnchorElement>(
      'a[href="https://example.com/contact"]',
    )!;
    const clickSpy = vi.spyOn(contactLink, 'click');
    for (const ch of 'contact') {
      pressKey(ch);
    }
    pressKey('Enter');
    expect(clickSpy).toHaveBeenCalled();
  });

  it('matches link when query words are separated by spaces', () => {
    // "Contact Info" should match query "contact info"
    const contactLink = document.querySelector<HTMLAnchorElement>(
      'a[href="https://example.com/contact"]',
    )!;
    const clickSpy = vi.spyOn(contactLink, 'click');

    pressKey('f'); // activate
    pressKey('/'); // search mode
    for (const ch of 'contact info') {
      pressKey(ch);
    }
    // Single match -> enters search-selecting
    pressKey('Enter');
    expect(clickSpy).toHaveBeenCalled();
  });

  it('matches link regardless of word order in query', () => {
    // "info contact" (reversed) should still match "Contact Info"
    const contactLink = document.querySelector<HTMLAnchorElement>(
      'a[href="https://example.com/contact"]',
    )!;
    const clickSpy = vi.spyOn(contactLink, 'click');

    pressKey('f'); // activate
    pressKey('/'); // search mode
    for (const ch of 'info contact') {
      pressKey(ch);
    }
    pressKey('Enter');
    expect(clickSpy).toHaveBeenCalled();
  });

  it('does not match when one space-separated word is absent', () => {
    pressKey('f'); // activate
    pressKey('/'); // search mode
    // 'a' matches all three links (all contain the letter 'a'), but 'xyz' matches none
    // so "a xyz" should produce zero matches
    for (const ch of 'a xyz') {
      pressKey(ch);
    }
    // 0 matches -> Enter should not follow any link
    const homeLink = document.querySelector<HTMLAnchorElement>(
      'a[href="https://example.com/home"]',
    )!;
    const aboutLink = document.querySelector<HTMLAnchorElement>(
      'a[href="https://example.com/about"]',
    )!;
    const contactLink = document.querySelector<HTMLAnchorElement>(
      'a[href="https://example.com/contact"]',
    )!;
    const homeClickSpy = vi.spyOn(homeLink, 'click');
    const aboutClickSpy = vi.spyOn(aboutLink, 'click');
    const contactClickSpy = vi.spyOn(contactLink, 'click');
    pressKey('Enter');
    expect(homeClickSpy).not.toHaveBeenCalled();
    expect(aboutClickSpy).not.toHaveBeenCalled();
    expect(contactClickSpy).not.toHaveBeenCalled();
  });

  it('treats multiple consecutive spaces like a single space', () => {
    // "home  page" (double space) should match "Home Page"
    const homeLink = document.querySelector<HTMLAnchorElement>(
      'a[href="https://example.com/home"]',
    )!;
    const clickSpy = vi.spyOn(homeLink, 'click');

    pressKey('f'); // activate
    pressKey('/'); // search mode
    for (const ch of 'home  page') {
      pressKey(ch);
    }
    pressKey('Enter');
    expect(clickSpy).toHaveBeenCalled();
  });
});
