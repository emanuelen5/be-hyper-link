import { getRegionForKey, getRegionLinks } from '../shared/keyboard-regions';
import type { LinkInfo, Settings } from '../shared/types';
import { HighlightManager } from './HighlightManager';
import { generateLabels, labelsMatch } from './LabelGenerator';
import { getVisibleLinks } from './LinkDetector';
import { Overlay } from './Overlay';

type State = 'idle' | 'active' | 'typing';

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

export class KeyboardHandler {
  private state: State = 'idle';
  private settings: Settings;
  private links: LinkInfo[] = [];
  private typed = '';
  private overlay: Overlay | null = null;
  private highlightManager: HighlightManager | null = null;
  // For keyboard-region mode: first key selects region
  private regionLinks: HTMLAnchorElement[] | null = null;

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
    this.overlay = new Overlay();
    this.highlightManager = new HighlightManager(
      this.settings.dimEnabled,
      this.settings.borderEnabled,
    );
    this.highlightManager.apply(this.links);
    this.overlay.render(this.links, this.typed);
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
    this.state = 'idle';
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

    // Active or typing state

    if (e.key === 'Escape') {
      this.deactivate();
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
    } else { // Non-handled key, just ignore and don't intercept
      return;
    }

    interceptEvent(e);
  }

  private handleSequentialKey(key: string): void {
    this.typed += key;
    this.state = 'typing';
    const matches = this.links.filter((l) => labelsMatch(l.label, this.typed));
    if (matches.length === 0) {
      this.deactivate();
      return;
    }
    if (matches.length === 1 && matches[0].label === this.typed) {
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

  private updateOverlay(): void {
    this.overlay?.render(this.links, this.typed);
  }

  private followLink(el: HTMLAnchorElement): void {
    this.deactivate();
    el.click();
  }
}
