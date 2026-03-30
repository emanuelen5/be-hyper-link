import { getRegionForKey, getRegionLinks } from '../shared/keyboard-regions';
import type { LinkInfo, OverlayMode, Settings } from '../shared/types';
import { HighlightManager } from './HighlightManager';
import { generateLabels, labelsMatch } from './LabelGenerator';
import { getVisibleFormElements, getVisibleLinks } from './LinkDetector';
import { Overlay } from './Overlay';

type State =
  | 'idle'
  | 'active'
  | 'typing'
  | 'searching'
  | 'search-selecting'
  | 'form'
  | 'form-focused';

const INPUT_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'CONTENTEDITABLE']);

function isFocusedOnInput(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  if (INPUT_TAGS.has(el.tagName)) return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}

function interceptEvent(e: KeyboardEvent) {
  e.preventDefault();
  e.stopPropagation();
}

function getLinkText(element: HTMLElement): string {
  return (element.textContent ?? '').trim().toLowerCase();
}

function searchLinks(links: LinkInfo[], query: string): LinkInfo[] {
  if (!query) return links;
  const words = query
    .toLowerCase()
    .split(' ')
    .filter((w) => w.length > 0);
  if (words.length === 0) return links;
  return links.filter((l) => {
    const text = getLinkText(l.element);
    return words.every((w) => text.includes(w));
  });
}

export class KeyboardHandler {
  private state: State = 'idle';
  private settings: Settings;
  private links: LinkInfo[] = [];
  private typed = '';
  private overlay: Overlay | null = null;
  private highlightManager: HighlightManager | null = null;
  // For keyboard-region mode: first key selects region
  private regionLinks: HTMLElement[] | null = null;
  // For search mode
  private searchQuery = '';
  private searchSelectedIndex = -1;
  // For form-focused mode: the currently focused form element
  private focusedFormElement: HTMLElement | null = null;

  private boundKeydown: (e: KeyboardEvent) => void;
  private boundScroll: () => void;

  constructor(settings: Settings) {
    this.settings = settings;
    this.boundKeydown = this.handleKeydown.bind(this);
    this.boundScroll = this.handleScroll.bind(this);
    document.addEventListener('keydown', this.boundKeydown, { capture: true });
  }

  updateSettings(settings: Settings): void {
    this.settings = settings;
  }

  destroy(): void {
    document.removeEventListener('keydown', this.boundKeydown, {
      capture: true,
    });
    this.deactivate();
  }

  private handleScroll(): void {
    if (this.settings.refreshLinksOnScroll) {
      this.refreshLinks();
    } else {
      this.refreshRects();
    }
    this.updateOverlay();
  }

  private refreshRects(): void {
    for (const link of this.links) {
      link.rect = link.element.getBoundingClientRect();
    }
  }

  private refreshLinks(): void {
    const anchors = getVisibleLinks();
    const existingElements = new Set(this.links.map((l) => l.element));
    const newAnchors = anchors.filter((el) => !existingElements.has(el));

    // Update rects for existing links
    this.refreshRects();

    if (newAnchors.length > 0) {
      const newLabels = generateLabels(
        this.links.length + newAnchors.length,
      ).slice(this.links.length);

      const newLinks: LinkInfo[] = newAnchors.map((el, i) => ({
        element: el,
        label: newLabels[i],
        rect: el.getBoundingClientRect(),
      }));

      this.links.push(...newLinks);
      this.highlightManager?.apply(this.links);
    }
  }

  private activate(): void {
    const anchors = getVisibleLinks();
    const labels = generateLabels(anchors.length);

    this.links = anchors.map((el, i) => ({
      element: el,
      label: labels[i],
      rect: el.getBoundingClientRect(),
    }));

    this.typed = '';
    this.regionLinks = null;
    this.searchQuery = '';
    this.searchSelectedIndex = -1;
    this.overlay = new Overlay();
    this.highlightManager = new HighlightManager(
      this.settings.dimEnabled,
      this.settings.borderEnabled,
    );
    this.highlightManager.apply(this.links);
    this.overlay.render(this.links, { kind: 'label', typed: '' });
    window.addEventListener('scroll', this.boundScroll, {
      capture: true,
      passive: true,
    });
    this.state = 'active';
  }

  private deactivate(): void {
    window.removeEventListener('scroll', this.boundScroll, { capture: true });
    this.overlay?.destroy();
    this.overlay = null;
    this.highlightManager?.clear();
    this.highlightManager = null;
    this.links = [];
    this.typed = '';
    this.regionLinks = null;
    this.searchQuery = '';
    this.searchSelectedIndex = -1;
    this.focusedFormElement = null;
    this.state = 'idle';
  }

  private enterSearchMode(): void {
    this.state = 'searching';
    this.searchQuery = '';
    this.searchSelectedIndex = -1;
    this.updateSearchHighlights();
    this.updateOverlay();
  }

  private enterFormMode(): void {
    const elements = getVisibleFormElements();
    const labels = generateLabels(elements.length);

    this.links = elements.map((el, i) => ({
      element: el,
      label: labels[i],
      rect: el.getBoundingClientRect(),
    }));

    this.typed = '';
    this.highlightManager?.apply(this.links);
    this.overlay?.render(this.links, { kind: 'label', typed: '' });
    this.state = 'form';
  }

  private handleKeydown(e: KeyboardEvent): void {
    if (this.state === 'idle') {
      if (
        e.key === this.settings.triggerKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !e.metaKey &&
        !isFocusedOnInput()
      ) {
        e.preventDefault();
        this.activate();
      }
      return;
    }

    if (this.state === 'searching') {
      this.handleSearchKeydown(e);
      return;
    }

    if (this.state === 'search-selecting') {
      this.handleSearchSelectingKeydown(e);
      return;
    }

    if (this.state === 'form') {
      this.handleFormKeydown(e);
      return;
    }

    if (this.state === 'form-focused') {
      this.handleFormFocusedKeydown(e);
      return;
    }

    // Active or typing state

    if (e.key === 'Escape') {
      this.deactivate();
      return;
    } else if (e.key === this.settings.searchKey) {
      interceptEvent(e);
      this.enterSearchMode();
      return;
    } else if (e.key === 'B' && e.shiftKey) {
      interceptEvent(e);
      this.enterFormMode();
      return;
    } else if (e.key === 'Enter') {
      const matches = this.links.filter((l) =>
        labelsMatch(l.label, this.typed),
      );
      if (matches.length === 1) {
        this.followLink(matches[0].element);
      }
      return;
    } else if (e.key === 'Backspace') {
      if (this.typed.length === 0) {
        this.deactivate();
      } else {
        this.typed = this.typed.slice(0, -1);
        this.updateOverlay();
      }
      return;
    } else if (e.key.length === 1 && e.key >= 'a' && e.key <= 'z') {
      if (this.settings.navigationMode === 'keyboard-region') {
        this.handleKeyboardRegionKey(e.key);
      } else {
        this.handleSequentialKey(e.key);
      }
    } else {
      // Non-handled key, just ignore and don't intercept
      return;
    }

    interceptEvent(e);
  }

  private handleSearchKeydown(e: KeyboardEvent): void {
    interceptEvent(e);

    if (e.key === 'Escape') {
      this.deactivate();
      return;
    }

    if (e.key === 'Enter') {
      const matches = searchLinks(this.links, this.searchQuery);
      if (matches.length >= 1) {
        // Enter search-selecting mode to tab through matches
        this.state = 'search-selecting';
        this.searchSelectedIndex = 0;
        this.updateSearchHighlights();
        this.updateOverlay();
      }
      return;
    }

    if (e.key === 'Backspace') {
      if (this.searchQuery.length === 0) {
        // Go back to active/label mode
        this.state = 'active';
        this.highlightManager?.apply(this.links);
        this.updateOverlay();
      } else {
        this.searchQuery = this.searchQuery.slice(0, -1);
        this.updateSearchHighlights();
        this.updateOverlay();
      }
      return;
    }

    // Accept any printable character for search
    if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
      this.searchQuery += e.key;
      const matches = searchLinks(this.links, this.searchQuery);
      if (matches.length === 1) {
        // Single match: highlight it green and wait for Enter
        this.state = 'search-selecting';
        this.searchSelectedIndex = 0;
      }
      this.updateSearchHighlights();
      this.updateOverlay();
    }
  }

  private handleSearchSelectingKeydown(e: KeyboardEvent): void {
    interceptEvent(e);

    if (e.key === 'Escape') {
      this.deactivate();
      return;
    }

    const matches = searchLinks(this.links, this.searchQuery);
    if (matches.length === 0) {
      this.deactivate();
      return;
    }

    if (e.key === 'Backspace') {
      this.state = 'searching';
      this.searchSelectedIndex = -1;
      if (this.searchQuery.length > 0) {
        this.searchQuery = this.searchQuery.slice(0, -1);
      }
      this.updateSearchHighlights();
      this.updateOverlay();
      return;
    }

    if (e.key === 'Tab') {
      if (e.shiftKey) {
        this.searchSelectedIndex =
          (this.searchSelectedIndex - 1 + matches.length) % matches.length;
      } else {
        this.searchSelectedIndex =
          (this.searchSelectedIndex + 1) % matches.length;
      }
      this.updateSearchHighlights();
      this.updateOverlay();
      return;
    }

    if (e.key === 'Enter') {
      const selected = matches[this.searchSelectedIndex];
      if (selected) {
        this.followLink(selected.element);
      }
      return;
    }
  }

  private handleFormKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      this.deactivate();
      return;
    } else if (e.key === 'Backspace') {
      interceptEvent(e);
      if (this.typed.length === 0) {
        this.deactivate();
      } else {
        this.typed = this.typed.slice(0, -1);
        this.updateOverlay();
      }
      return;
    } else if (e.key === 'Enter') {
      interceptEvent(e);
      const matches = this.links.filter((l) =>
        labelsMatch(l.label, this.typed),
      );
      if (matches.length === 1) {
        this.activateFormElement(matches[0].element);
      }
      return;
    } else if (e.key.length === 1 && e.key >= 'a' && e.key <= 'z') {
      interceptEvent(e);
      this.handleFormKey(e.key);
    }
  }

  private handleFormKey(key: string): void {
    this.typed += key;
    const matches = this.links.filter((l) => labelsMatch(l.label, this.typed));
    if (matches.length === 0) {
      this.deactivate();
      return;
    }
    if (
      matches.length === 1 &&
      matches[0].label === this.typed &&
      !this.settings.confirmBeforeFollow
    ) {
      this.activateFormElement(matches[0].element);
      return;
    }
    this.updateOverlay();
  }

  private isClickableFormElement(el: HTMLElement): boolean {
    if (el.tagName === 'BUTTON') return true;
    if (el.getAttribute('role') === 'button') return true;
    const inputType = ((el as HTMLInputElement).type ?? '').toLowerCase();
    return ['submit', 'button', 'reset', 'checkbox', 'radio'].includes(
      inputType,
    );
  }

  private activateFormElement(el: HTMLElement): void {
    if (this.isClickableFormElement(el)) {
      this.deactivate();
      el.click();
    } else {
      // Keep the extension active in form-focused state so Escape can blur
      this.overlay?.destroy();
      this.overlay = null;
      this.highlightManager?.clear();
      this.highlightManager = null;
      this.focusedFormElement = el;
      this.state = 'form-focused';
      el.focus();
    }
  }

  private handleFormFocusedKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      interceptEvent(e);
      this.focusedFormElement?.blur();
      this.deactivate();
    }
    // All other keys pass through to the focused input
  }

  private updateSearchHighlights(): void {
    const matches = searchLinks(this.links, this.searchQuery);
    const matchedElements = new Set(matches.map((m) => m.element));
    const selectedElement =
      this.state === 'search-selecting' && matches[this.searchSelectedIndex]
        ? matches[this.searchSelectedIndex].element
        : null;
    this.highlightManager?.applySearchHighlights(
      this.links,
      matchedElements,
      selectedElement,
    );
  }

  private handleSequentialKey(key: string): void {
    this.typed += key;
    this.state = 'typing';
    const matches = this.links.filter((l) => labelsMatch(l.label, this.typed));
    if (matches.length === 0) {
      this.deactivate();
      return;
    }
    if (
      matches.length === 1 &&
      matches[0].label === this.typed &&
      !this.settings.confirmBeforeFollow
    ) {
      this.followLink(matches[0].element);
      return;
    }
    this.updateOverlay();
  }

  private handleKeyboardRegionKey(key: string): void {
    if (this.regionLinks === null) {
      // First key: select region
      const region = getRegionForKey(key);
      if (!region) {
        this.deactivate();
        return;
      }
      const allAnchors = this.links.map((l) => l.element);
      this.regionLinks = getRegionLinks(allAnchors, region);
      // Assign new labels within region
      const labels = generateLabels(this.regionLinks.length);
      this.links = this.regionLinks.map((el, i) => ({
        element: el,
        label: labels[i],
        rect: el.getBoundingClientRect(),
      }));
      this.typed = '';
      this.updateOverlay();
      return;
    }

    // Second+ key: sequential within region
    this.handleSequentialKey(key);
  }

  private getOverlayMode(): OverlayMode {
    if (this.state === 'searching' || this.state === 'search-selecting') {
      return {
        kind: 'search',
        query: this.searchQuery,
        selectedIndex: this.searchSelectedIndex,
      };
    }
    return { kind: 'label', typed: this.typed };
  }

  private updateOverlay(): void {
    this.overlay?.render(this.links, this.getOverlayMode());
  }

  private followLink(el: HTMLElement): void {
    this.deactivate();
    el.click();
  }
}
