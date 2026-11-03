import { DEFAULT_SETTINGS, ExtensionSettings } from './types.js';

const SETTINGS_KEY = 'emotion_context_settings';

/**
 * In-memory fallback for test environments or when chrome.storage is unavailable
 */
let inMemorySettings: ExtensionSettings = { ...DEFAULT_SETTINGS };

/**
 * Retrieves settings from chrome.storage.local (or in-memory fallback in tests)
 */
export async function getSettings(): Promise<ExtensionSettings> {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      const data = await chrome.storage.local.get(SETTINGS_KEY);
      const stored = data?.[SETTINGS_KEY] as Partial<ExtensionSettings> | undefined;
      if (stored) {
        return {
          ...DEFAULT_SETTINGS,
          ...stored,
          siteSettings: {
            ...DEFAULT_SETTINGS.siteSettings,
            ...(stored.siteSettings || {}),
          },
        };
      }
    }
  } catch {
    // Fail gracefully to in-memory store
  }
  return { ...inMemorySettings };
}

/**
 * Persists settings to chrome.storage.local.
 * PRIVACY RULE: Never persist message text or analysis results. Only settings.
 */
export async function saveSettings(
  settings: Partial<ExtensionSettings>
): Promise<ExtensionSettings> {
  const current = await getSettings();
  const updated: ExtensionSettings = {
    ...current,
    ...settings,
    siteSettings: {
      ...current.siteSettings,
      ...(settings.siteSettings || {}),
    },
  };

  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set({ [SETTINGS_KEY]: updated });
    }
  } catch {
    // Fail gracefully
  }

  inMemorySettings = { ...updated };
  return updated;
}

/**
 * Checks if the extension is enabled for a specific hostname.
 */
export function isSiteEnabled(settings: ExtensionSettings, hostname: string): boolean {
  if (!settings.enabled) return false;

  // Normalize hostname (e.g. "www.chatgpt.com" -> "chatgpt.com")
  const normalized = hostname.replace(/^www\./, '');
  if (normalized in settings.siteSettings) {
    return settings.siteSettings[normalized];
  }
  return true;
}

/**
 * Subscribes to settings changes from chrome.storage.
 */
export function onSettingsChanged(callback: (settings: ExtensionSettings) => void): () => void {
  const listener = (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
    if (areaName === 'local' && changes[SETTINGS_KEY]?.newValue) {
      callback(changes[SETTINGS_KEY].newValue as ExtensionSettings);
    }
  };

  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener(listener);
    return () => {
      chrome.storage.onChanged.removeListener(listener);
    };
  }

  return () => {};
}
