import browser from 'webextension-polyfill';
import { DEFAULT_SETTINGS } from '../shared/types';
import type { Settings } from '../shared/types';

// Initialize settings if not present
browser.storage.local.get('settings').then((result) => {
  if (!result['settings']) {
    browser.storage.local.set({ settings: DEFAULT_SETTINGS });
  }
});

// Relay settings updates to all content scripts in the active tab
browser.runtime.onMessage.addListener(
  (message: unknown, _sender, sendResponse) => {
    if (
      message &&
      typeof message === 'object' &&
      (message as Record<string, unknown>)['type'] === 'save-settings'
    ) {
      const settings = (message as Record<string, unknown>)[
        'settings'
      ] as Settings;
      browser.storage.local.set({ settings }).then(() => {
        // Notify all tabs
        browser.tabs.query({}).then((tabs) => {
          for (const tab of tabs) {
            if (tab.id !== undefined) {
              browser.tabs
                .sendMessage(tab.id, {
                  type: 'settings-updated',
                  settings,
                })
                .catch(() => {
                  // Tab may not have content script
                });
            }
          }
        });
        sendResponse({ ok: true });
      });
      return true; // keep message channel open for async response
    }
  },
);
