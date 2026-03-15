import type { LinkInfo } from '../shared/types';

const TINT_ID = 'hyper-link-tint';
const BORDER_CLASS = 'hyper-link-border';

/**
 * Applies a dim overlay and/or borders around links depending on settings.
 */
export class HighlightManager {
  private dimEnabled: boolean;
  private borderEnabled: boolean;
  private tintEl: HTMLElement | null = null;
  private borderedLinks: HTMLAnchorElement[] = [];

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

  clear(): void {
    if (this.tintEl) {
      this.tintEl.remove();
      this.tintEl = null;
    }
    for (const link of this.borderedLinks) {
      link.classList.remove(BORDER_CLASS);
      link.style.removeProperty('outline');
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
