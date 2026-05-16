function isVisible(el: HTMLElement): boolean {
  const style = window.getComputedStyle(el);
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0'
  );
}

function isInViewport(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect();
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.bottom > 0 &&
    rect.top < window.innerHeight &&
    rect.right > 0 &&
    rect.left < window.innerWidth &&
    isVisible(el)
  );
}

function sortByPosition<T extends HTMLElement>(elements: T[]): T[] {
  return elements.sort((a, b) => {
    const ra = a.getBoundingClientRect();
    const rb = b.getBoundingClientRect();
    if (Math.abs(ra.top - rb.top) > 10) return ra.top - rb.top;
    return ra.left - rb.left;
  });
}

const FORM_SELECTOR =
  'button, input:not([type="hidden"]), textarea, select, [role="button"], a:not([href])';

export function getVisibleLinks(): HTMLAnchorElement[] {
  const links = Array.from(
    document.querySelectorAll<HTMLAnchorElement>('a[href]'),
  );
  return sortByPosition(links.filter(isInViewport));
}

export function getVisibleFormElements(): HTMLElement[] {
  const elements = Array.from(
    document.querySelectorAll<HTMLElement>(FORM_SELECTOR),
  );
  return sortByPosition(
    elements.filter(
      (el) => isInViewport(el) && !(el as HTMLInputElement).disabled,
    ),
  );
}
