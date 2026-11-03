import { getSettings, saveSettings } from '../storage/settings.js';
import { AnalyzerMode, ExtensionSettings } from '../storage/types.js';

document.addEventListener('DOMContentLoaded', async () => {
  const globalToggle = document.getElementById('global-toggle') as HTMLInputElement;
  const siteToggle = document.getElementById('site-toggle') as HTMLInputElement;
  const siteControlRow = document.getElementById('site-control-row') as HTMLElement;
  const currentSiteLabel = document.getElementById('current-site-label') as HTMLElement;
  const previewToggle = document.getElementById('preview-toggle') as HTMLInputElement;
  const analyzerModeSelect = document.getElementById('analyzer-mode-select') as HTMLSelectElement;
  const statusPill = document.getElementById('status-pill') as HTMLElement;
  const openOptionsBtn = document.getElementById('open-options-btn') as HTMLButtonElement;

  let currentSettings: ExtensionSettings = await getSettings();
  let currentHostname = '';

  // Detect current active tab hostname
  if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
    try {
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tabs[0]?.url) {
        const url = new URL(tabs[0].url);
        currentHostname = url.hostname.replace(/^www\./, '');
      }
    } catch {
      // Ignore
    }
  }

  const supportedSites = ['chatgpt.com', 'claude.ai', 'gemini.google.com'];
  const isSupported = supportedSites.includes(currentHostname);

  if (isSupported) {
    currentSiteLabel.textContent = currentHostname;
    siteToggle.checked = currentSettings.siteSettings[currentHostname] !== false;
  } else {
    siteControlRow.style.display = 'none';
  }

  function updateUI() {
    globalToggle.checked = currentSettings.enabled;
    previewToggle.checked = currentSettings.previewMode;
    analyzerModeSelect.value = currentSettings.analyzerMode;

    const isActive =
      currentSettings.enabled &&
      (!isSupported || currentSettings.siteSettings[currentHostname] !== false);

    if (isActive) {
      statusPill.textContent = 'Active';
      statusPill.className = 'status-pill';
    } else {
      statusPill.textContent = 'Disabled';
      statusPill.className = 'status-pill disabled';
    }
  }

  updateUI();

  globalToggle.addEventListener('change', async () => {
    currentSettings = await saveSettings({ enabled: globalToggle.checked });
    updateUI();
  });

  siteToggle.addEventListener('change', async () => {
    if (currentHostname) {
      const siteSettings = {
        ...currentSettings.siteSettings,
        [currentHostname]: siteToggle.checked,
      };
      currentSettings = await saveSettings({ siteSettings });
      updateUI();
    }
  });

  previewToggle.addEventListener('change', async () => {
    currentSettings = await saveSettings({
      previewMode: previewToggle.checked,
    });
    updateUI();
  });

  analyzerModeSelect.addEventListener('change', async () => {
    currentSettings = await saveSettings({
      analyzerMode: analyzerModeSelect.value as AnalyzerMode,
    });
    updateUI();
  });

  openOptionsBtn.addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.runtime?.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open('options.html');
    }
  });
});
