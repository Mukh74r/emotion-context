import { readElementText, setElementText } from './domUtils.js';
import { SiteAdapter } from './types.js';

export class ChatGPTAdapter implements SiteAdapter {
  public readonly id = 'chatgpt';
  public readonly name = 'ChatGPT';

  public matches(url: string): boolean {
    return /^https?:\/\/([a-zA-Z0-9-]+\.)?chatgpt\.com(\/.*)?$/i.test(url);
  }

  public getInput(): HTMLElement | null {
    // Isolated selectors for ChatGPT's evolving DOM
    const selectors = [
      '#prompt-textarea',
      'div#prompt-textarea[contenteditable="true"]',
      'textarea#prompt-textarea',
      'textarea[data-id="root"]',
      'form textarea',
      'div[contenteditable="true"][data-placeholder]',
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
    const selectors = [
      'button[data-testid="send-button"]',
      'button[aria-label="Send prompt"]',
      'button[aria-label="Send message"]',
      'button[data-testid="fruitjuice-send-button"]',
      'form button[type="submit"]',
    ];

    for (const selector of selectors) {
      const button = document.querySelector<HTMLElement>(selector);
      if (button) return button;
    }

    return null;
  }

  public getContainer(): HTMLElement | null {
    const input = this.getInput();
    if (!input) return null;
    return input.closest('form') || input.parentElement || input;
  }
}
