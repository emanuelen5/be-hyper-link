export type NavigationMode = 'sequential' | 'keyboard-region';

export interface Settings {
  navigationMode: NavigationMode;
  dimEnabled: boolean;
  borderEnabled: boolean;
  refreshLinksOnScroll: boolean;
  confirmBeforeFollow: boolean;
  triggerKey: string;
  searchKey: string;
}

export const DEFAULT_SETTINGS: Settings = {
  navigationMode: 'sequential',
  dimEnabled: true,
  borderEnabled: true,
  refreshLinksOnScroll: false,
  confirmBeforeFollow: false,
  triggerKey: '/',
  searchKey: '/',
};

export interface LinkInfo {
  element: HTMLElement;
  label: string;
  rect: DOMRect;
}

export type OverlayMode =
  | { kind: 'label'; typed: string }
  | { kind: 'search'; query: string; selectedIndex: number };
