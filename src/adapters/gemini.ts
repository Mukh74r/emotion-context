import { readElementText, setElementText } from './domUtils.js';
import { SiteAdapter } from './types.js';

export class GeminiAdapter implements SiteAdapter {
  public readonly id = 'gemini';
  public readonly name = 'Gemini';

  public matches(url: string): boolean {
    return /^https?:\/\/([a-zA-Z0-9-]+\.)?gemini\.google\.com(\/.*)?$/i.test(url);
  }

  public getInput(): HTMLElement | null {
    // Isolated selectors for Gemini's rich-textarea editor
    const selectors = [
      'rich-textarea .ql-editor[contenteditable="true"]',
      'div.ql-editor[contenteditable="true"]',
      '.textarea[contenteditable="true"]',
      'div[contenteditable="true"][role="textbox"]',
      'textarea.textarea',
      'rich-textarea textarea',
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
      'button.send-button',
      'button[aria-label="Send message"]',
      'button[aria-label="Send prompt"]',
      'button[data-test-id="send-button"]',
      '.send-button-container button',
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
    return input.closest('rich-textarea') || input.parentElement || input;
  }
}
