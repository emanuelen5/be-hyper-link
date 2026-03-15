import { generateLabels, labelsMatch } from './LabelGenerator';
import { getVisibleLinks } from './LinkDetector';
import { Overlay } from './Overlay';
import { HighlightManager } from './HighlightManager';
import { getRegionForKey, getRegionLinks } from '../shared/keyboard-regions';
import type { Settings, LinkInfo } from '../shared/types';

type State = 'idle' | 'active' | 'typing';

const INPUT_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'CONTENTEDITABLE']);

function isFocusedOnInput(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  if (INPUT_TAGS.has(el.tagName)) return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
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

  constructor(settings: Settings) {
    this.settings = settings;
    this.boundKeydown = this.handleKeydown.bind(this);
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
    this.highlightManager = new HighlightManager(this.settings.highlightMode);
    this.highlightManager.apply(this.links);
    this.overlay.render(this.links, this.typed);
    this.state = 'active';
  }

  private deactivate(): void {
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
    e.preventDefault();
    e.stopPropagation();

    if (e.key === 'Escape') {
      this.deactivate();
      return;
    }

    if (e.key === 'Enter') {
      const matches = this.links.filter((l) =>
        labelsMatch(l.label, this.typed),
      );
      if (matches.length === 1) {
        this.followLink(matches[0].element);
      }
      return;
    }

    if (e.key === 'Backspace') {
      this.typed = this.typed.slice(0, -1);
      this.updateOverlay();
      return;
    }

    if (e.key.length !== 1) return;

    if (this.settings.navigationMode === 'keyboard-region') {
      this.handleKeyboardRegionKey(e.key);
    } else {
      this.handleSequentialKey(e.key);
    }
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
