import browser from 'webextension-polyfill';
import { KeyboardHandler } from './KeyboardHandler';
import { DEFAULT_SETTINGS, isMessageOfType } from '../shared/types';
import type { Settings } from '../shared/types';

let handler: KeyboardHandler | null = null;

function init(settings: Settings): void {
  handler?.destroy();
  handler = new KeyboardHandler(settings);
}

// Load settings from storage, then start
browser.storage.local
  .get('settings')
  .then((result: Record<string, unknown>) => {
    const settings: Settings = {
      ...DEFAULT_SETTINGS,
      ...(result['settings'] as Partial<Settings>),
    };
    init(settings);
  })
  .catch(() => {
    init(DEFAULT_SETTINGS);
  });

// Listen for settings updates from popup
browser.runtime.onMessage.addListener((message: unknown) => {
  if (isMessageOfType(message, 'settings-updated')) {
    const updated = message['settings'] as Settings;
    handler?.updateSettings(updated);
  }
});
