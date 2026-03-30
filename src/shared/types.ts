export type NavigationMode = 'sequential' | 'keyboard-region';

export interface TriggerKey {
  key: string;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
}

export function formatTriggerKey(trigger: TriggerKey): string {
  const parts: string[] = [];
  if (trigger.ctrl) parts.push('Ctrl');
  if (trigger.alt) parts.push('Alt');
  if (trigger.shift) parts.push('Shift');
  if (trigger.meta) parts.push('Meta');
  parts.push(trigger.key);
  return parts.join('+');
}

export interface Settings {
  navigationMode: NavigationMode;
  dimEnabled: boolean;
  borderEnabled: boolean;
  refreshLinksOnScroll: boolean;
  confirmBeforeFollow: boolean;
  trigger: TriggerKey;
  searchKey: string;
}

export const DEFAULT_SETTINGS: Settings = {
  navigationMode: 'sequential',
  dimEnabled: true,
  borderEnabled: true,
  refreshLinksOnScroll: false,
  confirmBeforeFollow: false,
  trigger: { key: '/', ctrl: false, alt: false, shift: false, meta: false },
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
