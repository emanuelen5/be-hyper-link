import ReactDOM from 'react-dom/client';
import type { LinkInfo } from '../shared/types';

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

interface OverlayProps {
  links: LinkInfo[];
  typed: string;
}

function OverlayRoot({ links, typed }: OverlayProps) {
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

  render(links: LinkInfo[], typed: string): void {
    this.reactRoot.render(<OverlayRoot links={links} typed={typed} />);
  }

  destroy(): void {
    this.reactRoot.unmount();
    this.host.remove();
  }
}
