export type NavigationMode = 'sequential' | 'keyboard-region';
export type HighlightMode = 'tint' | 'border';

export interface Settings {
  navigationMode: NavigationMode;
  highlightMode: HighlightMode;
  triggerKey: string;
}

export const DEFAULT_SETTINGS: Settings = {
  navigationMode: 'sequential',
  highlightMode: 'tint',
  triggerKey: 'f',
};

export interface LinkInfo {
  element: HTMLAnchorElement;
  label: string;
  rect: DOMRect;
}
