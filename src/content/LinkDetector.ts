export function getVisibleLinks(): HTMLAnchorElement[] {
  const links = Array.from(
    document.querySelectorAll<HTMLAnchorElement>('a[href]'),
  );
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;

  return links
    .filter((link) => {
      const rect = link.getBoundingClientRect();
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        rect.bottom > 0 &&
        rect.top < viewportHeight &&
        rect.right > 0 &&
        rect.left < viewportWidth &&
        isVisible(link)
      );
    })
    .sort((a, b) => {
      const ra = a.getBoundingClientRect();
      const rb = b.getBoundingClientRect();
      if (Math.abs(ra.top - rb.top) > 10) return ra.top - rb.top;
      return ra.left - rb.left;
    });
}

function isVisible(el: HTMLElement): boolean {
  const style = window.getComputedStyle(el);
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0'
  );
}
