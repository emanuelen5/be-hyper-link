import React, { useEffect, useState } from 'react';
import { DEFAULT_SETTINGS } from '../shared/types';
import type { Settings, NavigationMode } from '../shared/types';

export function Popup() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    browser.storage.local.get('settings').then((result) => {
      if (result['settings']) {
        setSettings(result['settings'] as Settings);
      }
    });
  }, []);

  function handleSave() {
    browser.runtime
      .sendMessage({ type: 'save-settings', settings })
      .then(() => {
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      });
  }

  return (
    <div>
      <h2 style={{ margin: '0 0 12px', fontSize: '16px' }}>be-hyper-link</h2>

      <label style={labelStyle}>
        Navigation Mode
        <select
          value={settings.navigationMode}
          onChange={(e) =>
            setSettings((s) => ({
              ...s,
              navigationMode: e.target.value as NavigationMode,
            }))
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
          onChange={(e) =>
            setSettings((s) => ({ ...s, dimEnabled: e.target.checked }))
          }
        />
        Dim page
      </label>

      <label style={checkboxLabelStyle}>
        <input
          type="checkbox"
          checked={settings.borderEnabled}
          onChange={(e) =>
            setSettings((s) => ({ ...s, borderEnabled: e.target.checked }))
          }
        />
        Border links
      </label>

      <label style={labelStyle}>
        Trigger Key
        <input
          type="text"
          maxLength={1}
          value={settings.triggerKey}
          onChange={(e) =>
            setSettings((s) => ({ ...s, triggerKey: e.target.value }))
          }
          style={{ ...selectStyle, width: '3em' }}
        />
      </label>

      <button onClick={handleSave} style={buttonStyle}>
        {saved ? 'Saved!' : 'Save'}
      </button>
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

const buttonStyle: React.CSSProperties = {
  marginTop: '8px',
  padding: '6px 16px',
  background: '#0060df',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '13px',
};
