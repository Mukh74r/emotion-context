import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ChatGPTAdapter } from '../src/adapters/chatgpt.js';
import { ContentController } from '../src/content/index.js';
import { ContentUI } from '../src/content/ui.js';
import { saveSettings } from '../src/storage/settings.js';
import { DEFAULT_SETTINGS } from '../src/storage/types.js';

describe('End-to-End Content Script & UI Integration', () => {
  beforeEach(async () => {
    document.body.innerHTML = '';
    await saveSettings({
      ...DEFAULT_SETTINGS,
      enabled: true,
      previewMode: false, // directly test append on submission
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('no-ops safely when adapter cannot find input elements (fail open)', async () => {
    document.body.innerHTML = '<div class="splash-screen">Loading application...</div>';

    const controller = new ContentController();
    // Should not throw or crash
    expect(() => controller.bindDOM()).not.toThrow();

    // Verify no extension elements are injected
    expect(document.querySelector('.ec-root')).toBeNull();
  });

  it('never modifies draft text when extension is toggled off', async () => {
    // Setup ChatGPT DOM
    document.body.innerHTML = `
      <form>
        <textarea id="prompt-textarea"></textarea>
        <button data-testid="send-button">Send</button>
      </form>
    `;

    // Disable extension
    await saveSettings({ enabled: false });

    // Mock window location
    delete (window as unknown as { location: unknown }).location;
    window.location = new URL('https://chatgpt.com/') as unknown as Location;

    const controller = new ContentController();
    await controller.init();

    const adapter = new ChatGPTAdapter();
    const originalText = "No, that's wrong again. Stop breaking it!! Just fix the bug.";
    adapter.setText(originalText);

    const input = adapter.getInput() as HTMLTextAreaElement;

    // Simulate Enter keydown
    const enterEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    });
    input.dispatchEvent(enterEvent);

    // Text must remain untouched
    expect(adapter.getText()).toBe(originalText);
  });

  it('appends direct-fix hint upon Enter for terse frustrated draft when enabled', async () => {
    document.body.innerHTML = `
      <form>
        <textarea id="prompt-textarea"></textarea>
        <button data-testid="send-button">Send</button>
      </form>
    `;

    await saveSettings({ enabled: true, previewMode: false });

    delete (window as unknown as { location: unknown }).location;
    window.location = new URL('https://chatgpt.com/') as unknown as Location;

    const controller = new ContentController();
    await controller.init();

    const adapter = new ChatGPTAdapter();
    const input = adapter.getInput() as HTMLTextAreaElement;
    input.value = "No, that's wrong again. Stop breaking it!! Just fix the bug.";

    // Trigger input change & debounce
    input.dispatchEvent(new Event('input', { bubbles: true }));

    // Wait for debounce timer
    await new Promise((resolve) => setTimeout(resolve, 350));

    // Press Enter to submit
    const enterEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    });
    input.dispatchEvent(enterEvent);

    const finalText = adapter.getText();
    expect(finalText).toContain("No, that's wrong again. Stop breaking it!! Just fix the bug.");
    expect(finalText).toContain('[Response format preference:');
    expect(finalText).toContain('Skip pleasantries, apologies, and preamble');
    expect(finalText).toContain('Maintain objective rigor');
  });

  it('displays non-intrusive safety banner and appends NOTHING for distress draft', async () => {
    document.body.innerHTML = `
      <form>
        <textarea id="prompt-textarea"></textarea>
        <button data-testid="send-button">Send</button>
      </form>
    `;

    await saveSettings({ enabled: true, previewMode: false });

    delete (window as unknown as { location: unknown }).location;
    window.location = new URL('https://chatgpt.com/') as unknown as Location;

    const controller = new ContentController();
    await controller.init();

    const adapter = new ChatGPTAdapter();
    const input = adapter.getInput() as HTMLTextAreaElement;
    const distressMsg = "I can't take this anymore, I feel completely hopeless and want to die";
    input.value = distressMsg;

    input.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 350));

    // Safety banner must be present in DOM
    const banner = document.querySelector('.ec-distress-banner');
    expect(banner).not.toBeNull();
    expect(banner?.textContent).toContain('This sounds heavy');

    // Press Enter to submit
    const enterEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    });
    input.dispatchEvent(enterEvent);

    // Text must NOT have any appended hint
    expect(adapter.getText()).toBe(distressMsg);
    expect(adapter.getText()).not.toContain('[Response format preference:');
  });

  it('does not duplicate hints if draft is edited after a hint is appended', async () => {
    document.body.innerHTML = `
      <form>
        <textarea id="prompt-textarea"></textarea>
        <button data-testid="send-button">Send</button>
      </form>
    `;

    await saveSettings({ enabled: true, previewMode: false });

    delete (window as unknown as { location: unknown }).location;
    window.location = new URL('https://chatgpt.com/') as unknown as Location;

    const controller = new ContentController();
    await controller.init();

    const adapter = new ChatGPTAdapter();
    const input = adapter.getInput() as HTMLTextAreaElement;

    // Simulate already appended text from prior turn
    input.value =
      "No, that's wrong again. Fix it!!\n\n[Response format preference: Skip pleasantries, apologies, and preamble; provide the direct fix or answer immediately. Maintain objective rigor: do not alter your factual assessment, agree uncritically, or soften necessary corrections.]";

    // User edits the draft
    input.value += ' And also fix the tests!!';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 350));

    // Submit
    const enterEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    });
    input.dispatchEvent(enterEvent);

    const finalText = adapter.getText();
    const hintOccurrences = finalText.split('[Response format preference:').length - 1;
    expect(hintOccurrences).toBe(1);
  });

  it('respects IME composition and does not submit during active composition', async () => {
    document.body.innerHTML = `
      <form>
        <textarea id="prompt-textarea"></textarea>
        <button data-testid="send-button">Send</button>
      </form>
    `;

    await saveSettings({ enabled: true });

    delete (window as unknown as { location: unknown }).location;
    window.location = new URL('https://chatgpt.com/') as unknown as Location;

    const controller = new ContentController();
    await controller.init();

    const adapter = new ChatGPTAdapter();
    const input = adapter.getInput() as HTMLTextAreaElement;
    input.value = 'こんにちは';

    // Enter while composing
    const imeEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      isComposing: true,
      bubbles: true,
      cancelable: true,
    });
    input.dispatchEvent(imeEvent);

    // Text untouched, not submitted
    expect(adapter.getText()).toBe('こんにちは');
  });

  it('supports preview mode where user can edit or remove hint before sending', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    let dismissed = false;
    let acceptedHint = '';

    const ui = new ContentUI(container, {
      onToggleEnabled: () => {},
      onAcceptHint: (hint) => {
        acceptedHint = hint;
      },
      onDismissHint: () => {
        dismissed = true;
      },
    });

    const sampleHint =
      '[Response format preference: Be concise; lead with the bottom line in under 150 words. Maintain objective rigor: do not alter your factual assessment, agree uncritically, or soften necessary corrections.]';

    ui.showPreview(sampleHint);

    const previewBox = document.querySelector('.ec-preview-box');
    expect(previewBox).not.toBeNull();

    const textarea = previewBox?.querySelector<HTMLTextAreaElement>('.ec-preview-textarea');
    expect(textarea?.value).toBe(sampleHint);

    // Test dismiss
    const removeBtn = previewBox?.querySelector<HTMLButtonElement>('.ec-btn-remove');
    removeBtn?.click();
    expect(dismissed).toBe(true);
    expect(document.querySelector('.ec-preview-box')).toBeNull();

    // Re-show and test accept
    ui.showPreview(sampleHint);
    const acceptBtn = document.querySelector<HTMLButtonElement>('.ec-btn-accept');
    acceptBtn?.click();
    expect(acceptedHint).toBe(sampleHint);
    expect(document.querySelector('.ec-preview-box')).toBeNull();
  });
});
