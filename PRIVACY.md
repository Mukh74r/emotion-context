# Privacy Policy — Emotion Context

**Effective Date:** November 3, 2026  
**Project:** Emotion Context Browser Extension (Open-Source)

Emotion Context is designed from first principles around **data minimization, local execution, and user agency**.

---

## 1. Summary (Plain Language)

- **Default is 100% Local:** Analysis of your draft prompts runs entirely inside your browser on your device.
- **Zero Network Calls:** In the default Local Mode, the extension makes **zero** HTTP, HTTPS, WebSocket, or remote network requests.
- **No Servers Owned:** This project owns, operates, and connects to no remote servers, databases, or analytics backends.
- **No Telemetry or Tracking:** There is no Google Analytics, PostHog, Sentry, Mixpanel, or telemetry probe included.
- **Zero Prompt Storage:** Your message drafts, prompts, emotional states, and tone scores are evaluated ephemerally in memory and discarded. They are **never** written to disk or browser storage.
- **Strictly Minimal Permissions:** The extension requests only `storage` (to save your settings) and host permissions for the supported chat domains (`chatgpt.com`, `claude.ai`, `gemini.google.com`).

---

## 2. Local Mode vs. Optional LLM Mode

### Local Mode (Default & Recommended)

- Uses an on-device rule-based heuristic analyzer.
- Operates 100% offline within the content script memory.
- Makes **no external API or network calls**.
- Safe for sensitive code, confidential data, and private thoughts.

### Optional LLM Mode (Explicit User Opt-In)

- If you choose to enable LLM Mode in the Options page:
  - You supply your own third-party API key (e.g., OpenAI or compatible endpoint).
  - Your API key is stored **only on your device** in `chrome.storage.local`.
  - When analyzing drafts, your browser sends the message draft text **directly** from your browser to your specified AI provider's endpoint using your API key.
  - The extension authors never see, route, intercept, or log your API key or draft text.
  - **Warning displayed in UI:** A prominent notice is presented whenever LLM mode is activated.

---

## 3. Data Storage & Persistence

The only data stored by Emotion Context is persisted in `chrome.storage.local`:

- `enabled` (boolean): Global extension toggle state.
- `previewMode` (boolean): Whether to show the confirmation preview box.
- `siteSettings` (object): Per-site enable/disable flags.
- `analyzerMode` (string): `'local'` or `'llm'`.
- `apiKey` (string): Your personal provider API key (only if you configure LLM mode).
- `apiEndpoint` (string): Custom endpoint URL (optional).
- `modelName` (string): Custom model name (optional).

**We never store draft text, chat history, or analysis results.**

---

## 4. Third-Party Web Sites

Emotion Context operates as a content script on:

- `https://chatgpt.com/*`
- `https://claude.ai/*`
- `https://gemini.google.com/*`

When you submit a message, the final text (including any appended formatting directives) is submitted directly by you to that third-party AI provider under that provider's terms of service and privacy policy.

---

## 5. Security & Disclosure

Because Emotion Context is open source under the MIT License, its entire source code and build output can be audited by anyone:
`https://github.com/Mukh74r/emotion-context`

If you have questions, concerns, or wish to report a security issue, please review our [SECURITY.md](SECURITY.md).
