export type AnalyzerMode = 'local' | 'llm';

export interface ExtensionSettings {
  enabled: boolean;
  previewMode: boolean;
  siteSettings: Record<string, boolean>;
  analyzerMode: AnalyzerMode;
  apiKey: string;
  apiEndpoint: string;
  modelName: string;
}

export const DEFAULT_SETTINGS: ExtensionSettings = {
  enabled: true,
  previewMode: true,
  siteSettings: {
    'chatgpt.com': true,
    'claude.ai': true,
    'gemini.google.com': true,
  },
  analyzerMode: 'local',
  apiKey: '',
  apiEndpoint: 'https://api.openai.com/v1/chat/completions',
  modelName: 'gpt-4o-mini',
};
