import { getSettings, saveSettings } from '../storage/settings.js';
import { DEFAULT_SETTINGS } from '../storage/types.js';

// Initialize default settings on install if not present
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    const current = await getSettings();
    if (!current) {
      await saveSettings(DEFAULT_SETTINGS);
    }
  }
});

// Handle extension keyboard shortcut (Alt+Shift+E)
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-extension') {
    const current = await getSettings();
    const updated = await saveSettings({ enabled: !current.enabled });

    // Broadcast change to active tabs on supported sites
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    for (const tab of tabs) {
      if (tab.id) {
        chrome.tabs
          .sendMessage(tab.id, {
            action: 'TOGGLE_EXTENSION',
            enabled: updated.enabled,
          })
          .catch(() => {
            // Ignore if content script is not loaded in this tab
          });
      }
    }
  }
});
