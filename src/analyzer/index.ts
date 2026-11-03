import { ExtensionSettings } from '../storage/types.js';
import { LLMAnalyzer } from './llm.js';
import { LocalHeuristicAnalyzer } from './local.js';
import { Analyzer } from './types.js';

export * from './types.js';
export * from './local.js';
export * from './llm.js';

/**
 * Returns the appropriate analyzer instance based on user settings.
 * Defaults strictly to LocalHeuristicAnalyzer (100% on-device, zero network).
 */
export function createAnalyzer(settings: ExtensionSettings): Analyzer {
  if (settings.analyzerMode === 'llm' && settings.apiKey) {
    return new LLMAnalyzer({
      apiKey: settings.apiKey,
      apiEndpoint: settings.apiEndpoint,
      modelName: settings.modelName,
    });
  }

  return new LocalHeuristicAnalyzer();
}
