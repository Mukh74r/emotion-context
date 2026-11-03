import { getSettings, saveSettings } from '../storage/settings.js';
import { AnalyzerMode, ExtensionSettings } from '../storage/types.js';

document.addEventListener('DOMContentLoaded', async () => {
  const globalEnabled = document.getElementById('opt-global-enabled') as HTMLInputElement;
  const previewMode = document.getElementById('opt-preview-mode') as HTMLInputElement;

  const siteChatGPT = document.getElementById('site-chatgpt') as HTMLInputElement;
  const siteClaude = document.getElementById('site-claude') as HTMLInputElement;
  const siteGemini = document.getElementById('site-gemini') as HTMLInputElement;

  const modeRadios = document.getElementsByName(
    'opt-analyzer-mode'
  ) as NodeListOf<HTMLInputElement>;
  const llmPanel = document.getElementById('llm-config-panel') as HTMLElement;

  const apiKeyInput = document.getElementById('opt-api-key') as HTMLInputElement;
  const apiEndpointInput = document.getElementById('opt-api-endpoint') as HTMLInputElement;
  const modelNameInput = document.getElementById('opt-model-name') as HTMLInputElement;

  const saveBtn = document.getElementById('save-settings-btn') as HTMLButtonElement;
  const saveStatus = document.getElementById('save-status') as HTMLElement;

  const settings: ExtensionSettings = await getSettings();

  // Populate form
  globalEnabled.checked = settings.enabled;
  previewMode.checked = settings.previewMode;

  siteChatGPT.checked = settings.siteSettings['chatgpt.com'] !== false;
  siteClaude.checked = settings.siteSettings['claude.ai'] !== false;
  siteGemini.checked = settings.siteSettings['gemini.google.com'] !== false;

  modeRadios.forEach((radio) => {
    radio.checked = radio.value === settings.analyzerMode;
  });

  if (settings.analyzerMode === 'llm') {
    llmPanel.classList.remove('hidden');
  } else {
    llmPanel.classList.add('hidden');
  }

  apiKeyInput.value = settings.apiKey || '';
  apiEndpointInput.value = settings.apiEndpoint || 'https://api.openai.com/v1/chat/completions';
  modelNameInput.value = settings.modelName || 'gpt-4o-mini';

  // Toggle LLM panel visibility
  modeRadios.forEach((radio) => {
    radio.addEventListener('change', () => {
      if (radio.checked && radio.value === 'llm') {
        llmPanel.classList.remove('hidden');
      } else {
        llmPanel.classList.add('hidden');
      }
    });
  });

  saveBtn.addEventListener('click', async () => {
    let selectedMode: AnalyzerMode = 'local';
    modeRadios.forEach((radio) => {
      if (radio.checked) {
        selectedMode = radio.value as AnalyzerMode;
      }
    });

    const updatedSettings: Partial<ExtensionSettings> = {
      enabled: globalEnabled.checked,
      previewMode: previewMode.checked,
      siteSettings: {
        'chatgpt.com': siteChatGPT.checked,
        'claude.ai': siteClaude.checked,
        'gemini.google.com': siteGemini.checked,
      },
      analyzerMode: selectedMode,
      apiKey: apiKeyInput.value.trim(),
      apiEndpoint: apiEndpointInput.value.trim(),
      modelName: modelNameInput.value.trim(),
    };

    await saveSettings(updatedSettings);

    saveStatus.textContent = 'Settings saved successfully!';
    setTimeout(() => {
      saveStatus.textContent = '';
    }, 3000);
  });
});
