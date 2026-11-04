import { readElementText, setElementText } from './domUtils.js';
import { SiteAdapter } from './types.js';

export class ClaudeAdapter implements SiteAdapter {
  public readonly id = 'claude';
  public readonly name = 'Claude';

  public matches(url: string): boolean {
    return /^https?:\/\/([a-zA-Z0-9-]+\.)?claude\.ai(\/.*)?$/i.test(url);
  }

  public getInput(): HTMLElement | null {
    if (typeof document === 'undefined') return null;
    // Isolated selectors for Claude's ProseMirror editor
    const selectors = [
      'div.ProseMirror[contenteditable="true"]',
      'fieldset div[contenteditable="true"]',
      'div[contenteditable="true"][data-placeholder]',
      'div[contenteditable="true"]',
      'textarea[placeholder*="Claude"]',
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
      'button[aria-label="Send Message"]',
      'button[aria-label="Send message"]',
      'button[data-testid="send-button"]',
      'button:has(svg[data-icon="arrow-up"])',
      'fieldset button[type="button"]:last-child',
    ];

    for (const selector of selectors) {
      try {
        const button = document.querySelector<HTMLElement>(selector);
        if (button) return button;
      } catch {
        // Handle CSS pseudo-selectors that might throw in older engines
      }
    }

    return null;
  }

  public getContainer(): HTMLElement | null {
    const input = this.getInput();
    if (!input) return null;
    return input.closest('fieldset') || input.parentElement || input;
  }
}
