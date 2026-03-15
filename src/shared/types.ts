export type NavigationMode = 'sequential' | 'keyboard-region';

export interface Settings {
  navigationMode: NavigationMode;
  dimEnabled: boolean;
  borderEnabled: boolean;
  refreshLinksOnScroll: boolean;
  triggerKey: string;
}

export const DEFAULT_SETTINGS: Settings = {
  navigationMode: 'sequential',
  dimEnabled: true,
  borderEnabled: false,
  refreshLinksOnScroll: false,
  triggerKey: 'f',
};

export interface LinkInfo {
  element: HTMLAnchorElement;
  label: string;
  rect: DOMRect;
}
