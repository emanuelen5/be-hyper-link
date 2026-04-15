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

function createButton(label: string, top = 100): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.textContent = label;
  document.body.appendChild(btn);
  mockVisible(btn, top);
  return btn;
}

function createInput(type = 'text', top = 200): HTMLInputElement {
  const inp = document.createElement('input');
  inp.type = type;
  document.body.appendChild(inp);
  mockVisible(inp, top);
  return inp;
}

function createTextarea(top = 300): HTMLTextAreaElement {
  const ta = document.createElement('textarea');
  document.body.appendChild(ta);
  mockVisible(ta, top);
  return ta;
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
};

describe('Form Mode', () => {
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

    // Create a link and some form elements
    createLink('https://example.com', 50);

    handler = new KeyboardHandler(settings);
  });

  afterEach(() => {
    handler.destroy();
  });

  it('enters form mode on Shift+B after activation', () => {
    createButton('Submit', 100);
    pressKey('f'); // activate
    const event = pressKey('B', { shiftKey: true }); // enter form mode
    expect(event.defaultPrevented).toBe(true);
  });

  it('does not enter form mode without Shift modifier', () => {
    pressKey('f'); // activate
    const event = pressKey('b'); // lowercase b – sequential label mode, not form
    expect(event.defaultPrevented).toBe(true); // still intercepted (label mode)
    // but it should NOT have entered form mode – Escape should just deactivate cleanly
    pressKey('Escape');
    const afterEscape = pressKey('a');
    expect(afterEscape.defaultPrevented).toBe(false); // idle, regular key not intercepted
  });

  it('clicks a button when its label is typed', () => {
    const btn = createButton('Submit', 100);
    const clickSpy = vi.spyOn(btn, 'click');

    pressKey('f'); // activate
    pressKey('B', { shiftKey: true }); // form mode
    // First label is 'a'; type it to select the button
    pressKey('a');
    expect(clickSpy).toHaveBeenCalled();
  });

  it('focuses a text input when its label is typed', () => {
    const inp = createInput('text', 200);
    const focusSpy = vi.spyOn(inp, 'focus');

    pressKey('f'); // activate
    pressKey('B', { shiftKey: true }); // form mode
    // Input gets first label 'a'; type it
    pressKey('a');
    expect(focusSpy).toHaveBeenCalled();
  });

  it('focuses a textarea when its label is typed', () => {
    const ta = createTextarea(200);
    const focusSpy = vi.spyOn(ta, 'focus');

    pressKey('f'); // activate
    pressKey('B', { shiftKey: true }); // form mode
    pressKey('a');
    expect(focusSpy).toHaveBeenCalled();
  });

  it('clicks a submit input when its label is typed', () => {
    const inp = createInput('submit', 200);
    const clickSpy = vi.spyOn(inp, 'click');

    pressKey('f'); // activate
    pressKey('B', { shiftKey: true }); // form mode
    pressKey('a');
    expect(clickSpy).toHaveBeenCalled();
  });

  it('deactivates on Escape in form mode (before selection)', () => {
    createButton('Cancel', 100);

    pressKey('f'); // activate
    pressKey('B', { shiftKey: true }); // form mode
    pressKey('Escape'); // deactivate

    // Back to idle: regular (non-trigger) key is not intercepted
    const event = pressKey('a');
    expect(event.defaultPrevented).toBe(false);
  });

  it('blurs focused input and deactivates on Escape in form-focused mode', () => {
    const inp = createInput('text', 200);
    const focusSpy = vi.spyOn(inp, 'focus');
    const blurSpy = vi.spyOn(inp, 'blur');

    pressKey('f'); // activate
    pressKey('B', { shiftKey: true }); // form mode
    pressKey('a'); // select input → focus it
    expect(focusSpy).toHaveBeenCalled();

    // Now press Escape to deselect/blur
    const escEvent = pressKey('Escape');
    expect(escEvent.defaultPrevented).toBe(true);
    expect(blurSpy).toHaveBeenCalled();
  });

  it('passes non-Escape keys through to focused input', () => {
    createInput('text', 200);

    pressKey('f'); // activate
    pressKey('B', { shiftKey: true }); // form mode
    pressKey('a'); // focus input

    // Regular typing should not be intercepted
    const keyEvent = pressKey('h');
    expect(keyEvent.defaultPrevented).toBe(false);
  });

  it('deactivates with Backspace when typed is empty in form mode', () => {
    createButton('Go', 100);

    pressKey('f'); // activate
    pressKey('B', { shiftKey: true }); // form mode
    pressKey('Backspace'); // empty typed → deactivate

    // Back to idle
    const event = pressKey('g');
    expect(event.defaultPrevented).toBe(false);
  });

  it('can navigate multiple form elements by label', () => {
    const btn1 = createButton('First', 100);
    const btn2 = createButton('Second', 200);
    const clickSpy1 = vi.spyOn(btn1, 'click');
    const clickSpy2 = vi.spyOn(btn2, 'click');

    pressKey('f'); // activate
    pressKey('B', { shiftKey: true }); // form mode
    // btn1 → 'a', btn2 → 'b'
    pressKey('b');
    expect(clickSpy2).toHaveBeenCalled();
    expect(clickSpy1).not.toHaveBeenCalled();
  });

  it('deactivates when typed label has no matches in form mode', () => {
    createButton('Only', 100); // gets label 'a'

    pressKey('f'); // activate
    pressKey('B', { shiftKey: true }); // form mode
    pressKey('z'); // no form element with label 'z'

    // Should be back to idle
    const event = pressKey('g');
    expect(event.defaultPrevented).toBe(false);
  });

  it('switches back to link mode on second Shift+B in form mode', () => {
    createButton('Submit', 100);

    // The link created in beforeEach is at top=50 and gets label 'a' in link mode
    const existingLink =
      document.querySelector<HTMLAnchorElement>('a[href="https://example.com"]')!;
    const clickSpy = vi.spyOn(existingLink, 'click');

    pressKey('f'); // activate
    pressKey('B', { shiftKey: true }); // form mode
    const shiftB = pressKey('B', { shiftKey: true }); // toggle back to link mode
    expect(shiftB.defaultPrevented).toBe(true);

    // Should now be in link mode – typing 'a' selects the first link
    pressKey('a');
    expect(clickSpy).toHaveBeenCalled();
  });
});
