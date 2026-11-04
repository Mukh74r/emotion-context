import { readElementText, setElementText } from './domUtils.js';
import { SiteAdapter } from './types.js';

export class ChatGPTAdapter implements SiteAdapter {
  public readonly id = 'chatgpt';
  public readonly name = 'ChatGPT';

  public matches(url: string): boolean {
    return /^https?:\/\/([a-zA-Z0-9-]+\.)?(chatgpt\.com|chat\.openai\.com)(\/.*)?$/i.test(url);
  }

  public getInput(): HTMLElement | null {
    if (typeof document === 'undefined') return null;
    // Isolated selectors for ChatGPT's evolving DOM across versions
    const selectors = [
      '#prompt-textarea',
      'div#prompt-textarea',
      'div#prompt-textarea[contenteditable="true"]',
      'textarea#prompt-textarea',
      'div.ProseMirror#prompt-textarea',
      'div.ProseMirror[contenteditable="true"]',
      'div[contenteditable="true"][data-placeholder]',
      'div[contenteditable="true"][role="textbox"]',
      'textarea[data-id="root"]',
      'form textarea',
      'div[contenteditable="true"]',
      'textarea',
    ];

    for (const selector of selectors) {
      const el = document.querySelector<HTMLElement>(selector);
      if (el) return el;
    }

    return null;
  }

  public getText(): string {
    return readElementText(this.getInput());
  }

  public setText(text: string): void {
    setElementText(this.getInput(), text);
  }

  public getSendButton(): HTMLElement | null {
    if (typeof document === 'undefined') return null;
    const selectors = [
      'button[data-testid="send-button"]',
      'button[aria-label="Send prompt"]',
      'button[aria-label="Send message"]',
      'button[data-testid="fruitjuice-send-button"]',
      'button[data-testid="composer-speech-button"] ~ button',
      'form button[type="submit"]',
    ];

    for (const selector of selectors) {
      try {
        const button = document.querySelector<HTMLElement>(selector);
        if (button) return button;
      } catch {
        // Ignore selector errors
      }
    }

    return null;
  }

  public getContainer(): HTMLElement | null {
    const input = this.getInput();
    if (!input) return null;
    return (
      input.closest('form') ||
      input.closest('div[class*="composer"]') ||
      input.closest('div.relative.flex') ||
      input.parentElement?.parentElement ||
      input.parentElement ||
      input
    );
  }
}
