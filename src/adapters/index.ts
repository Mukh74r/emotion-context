import { ChatGPTAdapter } from './chatgpt.js';
import { ClaudeAdapter } from './claude.js';
import { GeminiAdapter } from './gemini.js';
import { SiteAdapter } from './types.js';

export * from './types.js';
export * from './domUtils.js';
export * from './chatgpt.js';
export * from './claude.js';
export * from './gemini.js';

export const ALL_ADAPTERS: SiteAdapter[] = [
  new ChatGPTAdapter(),
  new ClaudeAdapter(),
  new GeminiAdapter(),
];

/**
 * Finds the appropriate SiteAdapter for the current URL.
 * If no adapter matches, returns null.
 */
export function getAdapter(url: string): SiteAdapter | null {
  for (const adapter of ALL_ADAPTERS) {
    if (adapter.matches(url)) {
      return adapter;
    }
  }
  return null;
}
