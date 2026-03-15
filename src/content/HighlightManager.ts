import type { HighlightMode, LinkInfo } from '../shared/types';

const TINT_ID = 'be-hyper-link-tint';
const BORDER_CLASS = 'be-hyper-link-border';

/**
 * Applies a tint overlay or borders around links depending on highlight mode.
 */
export class HighlightManager {
  private mode: HighlightMode;
  private tintEl: HTMLElement | null = null;
  private borderedLinks: HTMLAnchorElement[] = [];

  constructor(mode: HighlightMode) {
    this.mode = mode;
  }

  apply(links: LinkInfo[]): void {
    this.clear();
    if (this.mode === 'tint') {
      this.applyTint();
    } else if (this.mode === 'border') {
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
