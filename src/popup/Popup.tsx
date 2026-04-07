import React, { useEffect, useState } from 'react';
import browser from 'webextension-polyfill';
import type { NavigationMode, Settings } from '../shared/types';
import { DEFAULT_SETTINGS, formatTriggerKey } from '../shared/types';
import { Toast } from './Toast';

const MODIFIER_KEYS = ['Control', 'Shift', 'Alt', 'Meta'];

export function Popup() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [capturingKey, setCapturingKey] = useState(false);
  const [toastTrigger, setToastTrigger] = useState(0);

  useEffect(() => {
    browser.storage.local.get('settings').then((result) => {
      if (result['settings']) {
        setSettings(result['settings'] as Settings);
      }
    });
  }, []);

  function updateSettings(partial: Partial<Settings>) {
    const newSettings = { ...settings, ...partial };
    setSettings(newSettings);
    browser.runtime.sendMessage({
      type: 'save-settings',
      settings: newSettings,
    });
    setToastTrigger((n) => n + 1);
  }

  function handleTriggerKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!capturingKey) return;
    e.preventDefault();
    e.stopPropagation();
    if (MODIFIER_KEYS.includes(e.key)) return;
    if (e.key === 'Escape') {
      setCapturingKey(false);
      (e.target as HTMLInputElement).blur();
      return;
    }
    updateSettings({
      trigger: {
        key: e.key,
        ctrl: e.ctrlKey,
        alt: e.altKey,
        shift: e.shiftKey,
        meta: e.metaKey,
      },
    });
    setCapturingKey(false);
    (e.target as HTMLInputElement).blur();
  }

  return (
    <div>
      <h2 style={{ margin: '0 0 12px', fontSize: '16px' }}>hyper-link</h2>

      <label style={labelStyle}>
        Navigation Mode
        <select
          value={settings.navigationMode}
          onChange={(e) =>
            updateSettings({ navigationMode: e.target.value as NavigationMode })
          }
          style={selectStyle}
        >
          <option value="sequential">Sequential (a, b, c…)</option>
          <option value="keyboard-region">Keyboard Region</option>
        </select>
      </label>

      <label style={checkboxLabelStyle}>
        <input
          type="checkbox"
          checked={settings.dimEnabled}
          onChange={(e) => updateSettings({ dimEnabled: e.target.checked })}
        />
        Dim page
      </label>

      <label style={checkboxLabelStyle}>
        <input
          type="checkbox"
          checked={settings.borderEnabled}
          onChange={(e) => updateSettings({ borderEnabled: e.target.checked })}
        />
        Border links
      </label>

      <label style={checkboxLabelStyle}>
        <input
          type="checkbox"
          checked={settings.refreshLinksOnScroll}
          onChange={(e) =>
            updateSettings({ refreshLinksOnScroll: e.target.checked })
          }
        />
        Continuously search for links on scroll
      </label>

      <label style={checkboxLabelStyle}>
        <input
          type="checkbox"
          checked={settings.confirmBeforeFollow}
          onChange={(e) =>
            updateSettings({ confirmBeforeFollow: e.target.checked })
          }
        />
        Confirm before following link
      </label>

      <label style={labelStyle}>
        Trigger Key
        <input
          type="text"
          readOnly
          value={capturingKey ? '' : formatTriggerKey(settings.trigger)}
          placeholder={capturingKey ? 'Press a key…' : ''}
          onFocus={() => setCapturingKey(true)}
          onBlur={() => setCapturingKey(false)}
          onKeyDown={handleTriggerKeyDown}
          style={{
            ...selectStyle,
            width: '8em',
            cursor: 'pointer',
            backgroundColor: capturingKey ? '#fff8e1' : undefined,
          }}
        />
      </label>

      <a
        href="../release-notes/release-notes.html"
        target="_blank"
        rel="noopener noreferrer"
        style={linkStyle}
      >
        Release Notes
      </a>

      <Toast message="Settings saved" trigger={toastTrigger} />
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  marginBottom: '10px',
};

const selectStyle: React.CSSProperties = {
  padding: '4px',
  borderRadius: '4px',
  border: '1px solid #ccc',
  fontSize: '13px',
};

const checkboxLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  marginBottom: '10px',
};

const linkStyle: React.CSSProperties = {
  display: 'block',
  marginTop: '12px',
  fontSize: '12px',
  color: '#0060df',
  textAlign: 'center',
};
