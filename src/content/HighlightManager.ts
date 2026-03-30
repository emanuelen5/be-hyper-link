import type { LinkInfo } from '../shared/types';

const TINT_ID = 'hyper-link-tint';
const BORDER_CLASS = 'hyper-link-border';
const SEARCH_MATCH_CLASS = 'hyper-link-search-match';
const SEARCH_FADED_CLASS = 'hyper-link-search-faded';
const SEARCH_SELECTED_CLASS = 'hyper-link-search-selected';

/**
 * Applies a dim overlay and/or borders around links depending on settings.
 */
export class HighlightManager {
  private dimEnabled: boolean;
  private borderEnabled: boolean;
  private tintEl: HTMLElement | null = null;
  private borderedLinks: HTMLElement[] = [];

  constructor(dimEnabled: boolean, borderEnabled: boolean) {
    this.dimEnabled = dimEnabled;
    this.borderEnabled = borderEnabled;
  }

  apply(links: LinkInfo[]): void {
    this.clear();
    if (this.dimEnabled) {
      this.applyTint();
    }
    if (this.borderEnabled) {
      this.applyBorders(links);
    }
  }

  /**
   * In search mode, all links get a border. Matched links are bright,
   * non-matched links are faded. The selected link gets a special highlight.
   */
  applySearchHighlights(
    allLinks: LinkInfo[],
    matchedElements: Set<HTMLElement>,
    selectedElement: HTMLElement | null,
  ): void {
    this.clearSearchHighlights();

    for (const { element } of allLinks) {
      if (element === selectedElement) {
        element.style.outline = '3px solid #4CAF50';
        element.style.outlineOffset = '1px';
        element.classList.add(SEARCH_SELECTED_CLASS);
      } else if (matchedElements.has(element)) {
        element.style.outline = '2px solid #ffcc00';
        element.classList.add(SEARCH_MATCH_CLASS);
      } else {
        element.style.outline = '2px solid rgba(255, 204, 0, 0.2)';
        element.classList.add(SEARCH_FADED_CLASS);
      }
      this.borderedLinks.push(element);
    }
  }

  private clearSearchHighlights(): void {
    for (const link of this.borderedLinks) {
      link.classList.remove(
        SEARCH_MATCH_CLASS,
        SEARCH_FADED_CLASS,
        SEARCH_SELECTED_CLASS,
      );
      link.style.removeProperty('outline');
      link.style.removeProperty('outline-offset');
    }
    this.borderedLinks = [];
  }

  clear(): void {
    if (this.tintEl) {
      this.tintEl.remove();
      this.tintEl = null;
    }
    for (const link of this.borderedLinks) {
      link.classList.remove(
        BORDER_CLASS,
        SEARCH_MATCH_CLASS,
        SEARCH_FADED_CLASS,
        SEARCH_SELECTED_CLASS,
      );
      link.style.removeProperty('outline');
      link.style.removeProperty('outline-offset');
    }
    this.borderedLinks = [];
  }

  private applyTint(): void {
    const tint = document.createElement('div');
    tint.id = TINT_ID;
    Object.assign(tint.style, {
      position: 'fixed',
      inset: '0',
      background: 'rgba(0,0,0,0.4)',
      zIndex: '2147483646',
      pointerEvents: 'none',
    });
    document.body.appendChild(tint);
    this.tintEl = tint;
  }

  private applyBorders(links: LinkInfo[]): void {
    for (const { element } of links) {
      element.style.outline = '2px solid #ffcc00';
      element.classList.add(BORDER_CLASS);
      this.borderedLinks.push(element);
    }
  }
}
