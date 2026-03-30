import ReactDOM from 'react-dom/client';
import type { LinkInfo, OverlayMode } from '../shared/types';

interface LabelBadgeProps {
  label: string;
  rect: DOMRect;
  typed: string;
  isMatch: boolean;
}

function LabelBadge({ label, rect, typed, isMatch }: LabelBadgeProps) {
  const matchedPart = label.slice(0, typed.length);
  const unmatchedPart = label.slice(typed.length);

  return (
    <div
      style={{
        position: 'fixed',
        left: rect.left,
        top: rect.top,
        opacity: isMatch ? 1 : 0.2,
        background: '#ffcc00',
        color: '#000',
        fontSize: '12px',
        fontFamily: 'monospace',
        fontWeight: 'bold',
        padding: '1px 4px',
        borderRadius: '3px',
        zIndex: 2147483647,
        pointerEvents: 'none',
        transition: 'opacity 0.15s',
        userSelect: 'none',
        lineHeight: '1.4',
      }}
    >
      <span style={{ color: '#d44' }}>{matchedPart}</span>
      {unmatchedPart}
    </div>
  );
}

function SearchBar({ query }: { query: string }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#1e1e1e',
        color: '#fff',
        fontSize: '16px',
        fontFamily: 'monospace',
        padding: '8px 16px',
        borderRadius: '8px',
        border: '2px solid #ffcc00',
        zIndex: 2147483647,
        pointerEvents: 'none',
        userSelect: 'none',
        minWidth: '200px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
      }}
    >
      <span style={{ color: '#888' }}>Search: </span>
      <span>{query}</span>
      <span
        style={{
          borderRight: '2px solid #ffcc00',
          animation: 'none',
          marginLeft: '1px',
        }}
      >
        &nbsp;
      </span>
    </div>
  );
}

interface SearchOverlayProps {
  links: LinkInfo[];
  query: string;
  selectedIndex: number;
}

function SearchOverlayRoot({
  links,
  query,
  selectedIndex,
}: SearchOverlayProps) {
  const words = query
    .toLowerCase()
    .split(' ')
    .filter((w) => w.length > 0);
  const matches =
    words.length > 0
      ? links.filter((l) => {
          const text = (l.element.textContent ?? '').trim().toLowerCase();
          return words.every((w) => text.includes(w));
        })
      : links;

  return (
    <>
      <SearchBar query={query} />
      {matches.map((info, i) => {
        const isSelected = selectedIndex >= 0 && i === selectedIndex;
        return (
          <SearchMatchBadge
            key={info.label}
            rect={info.rect}
            text={(info.element.textContent ?? '').trim()}
            query={query}
            isSelected={isSelected}
          />
        );
      })}
    </>
  );
}

interface SearchMatchBadgeProps {
  rect: DOMRect;
  text: string;
  query: string;
  isSelected: boolean;
}

function SearchMatchBadge({
  rect,
  text,
  query,
  isSelected,
}: SearchMatchBadgeProps) {
  // Truncate long link text for the badge
  const displayText = text.length > 40 ? text.slice(0, 37) + '...' : text;

  return (
    <div
      style={{
        position: 'fixed',
        left: rect.left,
        top: rect.top - 18,
        background: isSelected ? '#4CAF50' : '#ffcc00',
        color: '#000',
        fontSize: '11px',
        fontFamily: 'monospace',
        fontWeight: isSelected ? 'bold' : 'normal',
        padding: '1px 4px',
        borderRadius: '3px',
        zIndex: 2147483647,
        pointerEvents: 'none',
        userSelect: 'none',
        lineHeight: '1.4',
        maxWidth: '300px',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        boxShadow: isSelected ? '0 0 6px rgba(76, 175, 80, 0.6)' : 'none',
      }}
    >
      {highlightMatch(displayText, query)}
    </div>
  );
}

function highlightMatch(text: string, query: string): (string | JSX.Element)[] {
  if (!query) return [text];
  const words = query
    .toLowerCase()
    .split(' ')
    .filter((w) => w.length > 0);
  if (words.length === 0) return [text];

  const lower = text.toLowerCase();

  // Collect all [start, end) ranges for each word occurrence
  const ranges: [number, number][] = [];
  for (const word of words) {
    let idx = 0;
    while (idx < lower.length) {
      const pos = lower.indexOf(word, idx);
      if (pos === -1) break;
      ranges.push([pos, pos + word.length]);
      idx = pos + word.length;
    }
  }

  if (ranges.length === 0) return [text];

  // Sort and merge overlapping ranges
  ranges.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const [start, end] of ranges) {
    if (merged.length > 0 && start <= merged[merged.length - 1][1]) {
      merged[merged.length - 1][1] = Math.max(
        merged[merged.length - 1][1],
        end,
      );
    } else {
      merged.push([start, end]);
    }
  }

  // Build the result array
  const result: (string | JSX.Element)[] = [];
  let pos = 0;
  for (const [start, end] of merged) {
    if (pos < start) result.push(text.slice(pos, start));
    result.push(
      <span
        key={`${start}-${end}`}
        style={{ background: '#ff6', fontWeight: 'bold' }}
      >
        {text.slice(start, end)}
      </span>,
    );
    pos = end;
  }
  if (pos < text.length) result.push(text.slice(pos));
  return result;
}

interface LabelOverlayProps {
  links: LinkInfo[];
  typed: string;
}

function LabelOverlayRoot({ links, typed }: LabelOverlayProps) {
  return (
    <>
      {links.map((info) => {
        const isMatch = info.label.startsWith(typed);
        return (
          <LabelBadge
            key={info.label}
            label={info.label}
            rect={info.rect}
            typed={typed}
            isMatch={isMatch}
          />
        );
      })}
    </>
  );
}

interface OverlayRootProps {
  links: LinkInfo[];
  mode: OverlayMode;
}

function OverlayRoot({ links, mode }: OverlayRootProps) {
  if (mode.kind === 'search') {
    return (
      <SearchOverlayRoot
        links={links}
        query={mode.query}
        selectedIndex={mode.selectedIndex}
      />
    );
  }
  return <LabelOverlayRoot links={links} typed={mode.typed} />;
}

export class Overlay {
  private host: HTMLElement;
  private shadowRoot: ShadowRoot;
  private reactRoot: ReactDOM.Root;

  constructor() {
    this.host = document.createElement('div');
    this.host.id = 'hyper-link-overlay';
    this.shadowRoot = this.host.attachShadow({ mode: 'open' });

    const container = document.createElement('div');
    this.shadowRoot.appendChild(container);
    document.body.appendChild(this.host);

    this.reactRoot = ReactDOM.createRoot(container);
  }

  render(links: LinkInfo[], mode: OverlayMode): void {
    this.reactRoot.render(<OverlayRoot links={links} mode={mode} />);
  }

  destroy(): void {
    this.reactRoot.unmount();
    this.host.remove();
  }
}
