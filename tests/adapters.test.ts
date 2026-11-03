import { describe, it, expect, beforeEach } from 'vitest';
import { ChatGPTAdapter } from '../src/adapters/chatgpt.js';
import { ClaudeAdapter } from '../src/adapters/claude.js';
import { GeminiAdapter } from '../src/adapters/gemini.js';
import { getAdapter } from '../src/adapters/index.js';

describe('Site Adapters Suite', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('Adapter URL Matching', () => {
    it('matches chatgpt.com URLs', () => {
      const adapter = getAdapter('https://chatgpt.com/');
      expect(adapter).toBeInstanceOf(ChatGPTAdapter);
      expect(getAdapter('https://chatgpt.com/c/12345')).toBeInstanceOf(ChatGPTAdapter);
    });

    it('matches claude.ai URLs', () => {
      const adapter = getAdapter('https://claude.ai/');
      expect(adapter).toBeInstanceOf(ClaudeAdapter);
      expect(getAdapter('https://claude.ai/chat/abc-123')).toBeInstanceOf(ClaudeAdapter);
    });

    it('matches gemini.google.com URLs', () => {
      const adapter = getAdapter('https://gemini.google.com/app');
      expect(adapter).toBeInstanceOf(GeminiAdapter);
    });

    it('returns null for unsupported domains', () => {
      expect(getAdapter('https://example.com')).toBeNull();
      expect(getAdapter('https://github.com')).toBeNull();
    });
  });

  describe('ChatGPT Adapter DOM Isolation', () => {
    it('finds textarea, reads, writes text, and finds send button', () => {
      document.body.innerHTML = `
        <form>
          <textarea id="prompt-textarea"></textarea>
          <button data-testid="send-button" type="submit">Send</button>
        </form>
      `;

      const adapter = new ChatGPTAdapter();
      const input = adapter.getInput();
      expect(input).not.toBeNull();

      adapter.setText('Hello ChatGPT');
      expect(adapter.getText()).toBe('Hello ChatGPT');

      const sendBtn = adapter.getSendButton();
      expect(sendBtn).not.toBeNull();
    });

    it('handles contenteditable div on newer ChatGPT DOMs', () => {
      document.body.innerHTML = `
        <form>
          <div id="prompt-textarea" contenteditable="true">Initial text</div>
          <button aria-label="Send prompt">Send</button>
        </form>
      `;

      const adapter = new ChatGPTAdapter();
      expect(adapter.getText()).toBe('Initial text');

      adapter.setText('Updated prompt');
      expect(adapter.getText()).toBe('Updated prompt');
    });

    it('fails open (returns null) when ChatGPT DOM elements are absent', () => {
      document.body.innerHTML = '<div class="random-page">No chat input</div>';
      const adapter = new ChatGPTAdapter();
      expect(adapter.getInput()).toBeNull();
      expect(adapter.getSendButton()).toBeNull();
      expect(adapter.getText()).toBe('');
    });
  });

  describe('Claude Adapter DOM Isolation', () => {
    it('finds ProseMirror contenteditable editor and reads/sets text', () => {
      document.body.innerHTML = `
        <fieldset>
          <div class="ProseMirror" contenteditable="true"><p>Draft in Claude</p></div>
          <button aria-label="Send Message">Send</button>
        </fieldset>
      `;

      const adapter = new ClaudeAdapter();
      expect(adapter.getInput()).not.toBeNull();
      expect(adapter.getText()).toContain('Draft in Claude');

      adapter.setText('New Claude text');
      expect(adapter.getText()).toBe('New Claude text');
      expect(adapter.getSendButton()).not.toBeNull();
    });

    it('fails open when Claude input is missing', () => {
      document.body.innerHTML = '<div>Waiting for login...</div>';
      const adapter = new ClaudeAdapter();
      expect(adapter.getInput()).toBeNull();
      expect(adapter.getText()).toBe('');
      expect(adapter.getSendButton()).toBeNull();
    });
  });

  describe('Gemini Adapter DOM Isolation', () => {
    it('finds rich-textarea editor and reads/sets text', () => {
      document.body.innerHTML = `
        <rich-textarea>
          <div class="ql-editor" contenteditable="true">Gemini prompt</div>
          <button class="send-button">Send</button>
        </rich-textarea>
      `;

      const adapter = new GeminiAdapter();
      expect(adapter.getInput()).not.toBeNull();
      expect(adapter.getText()).toBe('Gemini prompt');

      adapter.setText('Updated Gemini prompt');
      expect(adapter.getText()).toBe('Updated Gemini prompt');
      expect(adapter.getSendButton()).not.toBeNull();
    });

    it('fails open when Gemini input is missing', () => {
      document.body.innerHTML = '<div>Welcome to Google</div>';
      const adapter = new GeminiAdapter();
      expect(adapter.getInput()).toBeNull();
      expect(adapter.getText()).toBe('');
      expect(adapter.getSendButton()).toBeNull();
    });
  });
});
