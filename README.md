# Emotion Context (🧭)

[![CI](https://github.com/Mukh74r/emotion-context/actions/workflows/ci.yml/badge.svg)](https://github.com/Mukh74r/emotion-context/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-success.svg)](manifest.json)
[![Zero Telemetry](https://img.shields.io/badge/Telemetry-Zero-brightgreen.svg)](PRIVACY.md)

An open-source, privacy-first Manifest V3 browser extension for Chrome, Edge, and Firefox. When typing into AI chat interfaces (ChatGPT, Claude, Google Gemini), **Emotion Context** analyzes the emotional tone and conversational posture of your draft in real-time. Just before sending, it injects an **anti-sycophantic response format preference** so models provide concise, structured, and factual answers without appeasing or validating.

---

## ⚡ What It Does

When users are frustrated, rushed, or overwhelmed, large language models often respond with excessive apologies, filler pleasantries, or sycophantic agreement rather than addressing the core problem.

Emotion Context intervenes at the input layer:

1. **Analyzes draft tone locally** in real-time as you type (frustrated, rushed, overwhelmed, uncertain, or distressed).
2. **Displays a floating indicator** (`Tone: frustrated, 82%`) near the input box with a one-click toggle.
3. **Offers an editable preview box** (default ON) letting you review, tweak, accept, or remove the generated formatting hint before submission.
4. **Appends an objective formatting directive with an epistemic rigor guardrail**:
   ```markdown
   [Response format preference: Skip pleasantries, apologies, and preamble; provide the direct fix or answer immediately. Maintain objective rigor: do not alter your factual assessment, agree uncritically, or soften necessary corrections.]
   ```

---

## 🛡️ Epistemic Guardrail & Anti-Sycophancy Design

> [!IMPORTANT]
> **Research Guardrail:** Traditional prompt enhancers tell the AI _"the user is frustrated, please be gentle/validating"_. Empirical research demonstrates this triggers **LLM sycophancy**—causing models to agree with false premises, soften corrections, and apologize endlessly.
>
> Emotion Context **never diagnoses the user** or asks the model for emotional support. Instead, it enforces structural formatting constraints paired with an explicit epistemic guardrail that commands the model to preserve factual accuracy above all.

| Detected State  | Injected Formatting Rule                                                                 | Epistemic Safeguard                                                                                                  |
| --------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Frustrated**  | Skip pleasantries, apologies, and preamble; provide the direct fix or answer immediately | Maintain objective rigor: do not alter your factual assessment, agree uncritically, or soften necessary corrections. |
| **Rushed**      | Be concise; lead with the bottom line in under 150 words                                 | Maintain objective rigor: do not alter your factual assessment, agree uncritically, or soften necessary corrections. |
| **Overwhelmed** | Break the explanation into 3-4 small, sequential steps; avoid dense jargon               | Maintain objective rigor: do not alter your factual assessment, agree uncritically, or soften necessary corrections. |
| **Uncertain**   | Compare the top 2-3 options with clear trade-offs before recommending one                | Maintain objective rigor: do not alter your factual assessment, agree uncritically, or soften necessary corrections. |
| **Distressed**  | **Nothing appended.** Displays safety resource banner with dismiss button.               | Safety path: Never block sending, never alter user message.                                                          |

---

## 🏗️ Architecture

```
emotion-context/
├── manifest.json              # Manifest V3 (Chrome, Edge, Firefox-ready)
├── popup.html                 # Quick status toggle & site settings
├── options.html               # Full settings, site toggles, LLM configuration
├── src/
│   ├── adapters/              # Isolated DOM site adapters (ChatGPT, Claude, Gemini)
│   │   ├── types.ts           # SiteAdapter interface (fail-open)
│   │   ├── domUtils.ts        # Contenteditable and textarea cross-DOM helpers
│   │   ├── chatgpt.ts         # chatgpt.com adapter
│   │   ├── claude.ts          # claude.ai adapter
│   │   └── gemini.ts          # gemini.google.com adapter
│   ├── analyzer/              # Dual-engine analysis
│   │   ├── types.ts           # AnalysisResult & Analyzer interface
│   │   ├── local.ts           # On-device heuristic engine (zero network calls)
│   │   └── llm.ts             # Optional user-configured LLM engine
│   ├── hints/
│   │   └── builder.ts         # Anti-sycophancy formatting directive builder
│   ├── storage/
│   │   ├── types.ts           # Extension settings schema
│   │   └── settings.ts        # chrome.storage.local wrapper (no message persistence)
│   ├── content/
│   │   ├── styles.css         # Scoped, conflict-free UI styles
│   │   ├── ui.ts              # Floating badge, preview bar, distress banner
│   │   └── index.ts           # Content script orchestrator & submit interceptor
│   └── background/
│       └── index.ts           # Service worker & keyboard shortcut handler
└── tests/                     # Vitest test suite with jsdom
```

---

## 🚀 Installation (Load Unpacked)

### Google Chrome & Microsoft Edge

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Mukh74r/emotion-context.git
   cd emotion-context
   ```
2. **Install dependencies and build:**
   ```bash
   npm install
   npm run build
   ```
   _This compiles TypeScript and assets into the `dist/` directory._
3. **Open extension manager:**
   - Chrome: Navigate to `chrome://extensions/`
   - Edge: Navigate to `edge://extensions/`
4. **Enable "Developer mode"** (toggle in the top-right corner).
5. **Click "Load unpacked"** and select the **`dist/`** folder inside the `emotion-context` project directory.
6. Open [ChatGPT](https://chatgpt.com), [Claude](https://claude.ai), or [Gemini](https://gemini.google.com) and start typing!

### Mozilla Firefox

1. Build the extension: `npm run build`.
2. Navigate to `about:debugging#/runtime/this-firefox`.
3. Click **"Load Temporary Add-on..."** and select `dist/manifest.json`.

---

## ⌨️ Shortcuts & UX Controls

- **`Alt+Shift+E`**: Toggle the extension on/off instantly without opening menus.
- **Floating Tone Indicator**: Sits near the active chat input. Shows detected tone and confidence percentage with a one-click toggle button.
- **Preview Box**: Allows reviewing the exact injected note, editing its wording, or clicking **"Remove"** to discard it for the current prompt.

---

## 🔌 How to Add a New Site Adapter

Site adapters isolate DOM selectors so host application DOM updates never crash the extension. If a site changes its DOM, the adapter fails open and the host application continues functioning normally.

To add a new site (e.g., DeepSeek, Perplexity, Poe):

1. **Create `src/adapters/<sitename>.ts`**:
   ```typescript
   import { SiteAdapter } from './types.js';
   import { readElementText, setElementText } from './domUtils.js';

   export class CustomSiteAdapter implements SiteAdapter {
     public readonly id = 'customsite';
     public readonly name = 'Custom AI Chat';

     public matches(url: string): boolean {
       return /^https?:\/\/([a-zA-Z0-9-]+\.)?customsite\.com(\/.*)?$/i.test(url);
     }

     public getInput(): HTMLElement | null {
       return document.querySelector('#chat-input, textarea.composer');
     }

     public getText(): string {
       return readElementText(this.getInput());
     }

     public setText(text: string): void {
       setElementText(this.getInput(), text);
     }

     public getSendButton(): HTMLElement | null {
       return document.querySelector('button[type="submit"], button.send-btn');
     }

     public getContainer(): HTMLElement | null {
       return this.getInput()?.closest('form') || null;
     }
   }
   ```
2. **Register the adapter in [`src/adapters/index.ts`](file:///home/ospoks/emotion-context/src/adapters/index.ts)**:
   Add your adapter to the `ALL_ADAPTERS` array.
3. **Add host permissions in [`manifest.json`](file:///home/ospoks/emotion-context/manifest.json)**:
   Add `"https://customsite.com/*"` to `host_permissions` and `content_scripts.matches`.
4. **Add unit test in [`tests/adapters.test.ts`](file:///home/ospoks/emotion-context/tests/adapters.test.ts)** verifying input detection, read/write, and send button lookup.

---

## ⚠️ Known Limitations

1. **Sarcasm and Passive-Aggression**: Sarcasm relies on subtle incongruence (e.g., _"Oh brilliant, another syntax error, you're a genius"_). Emotion Context actively penalizes confidence below $0.6$ on sarcastic inputs to avoid injecting spurious hints, but subtle irony may be categorized as neutral.
2. **Terse Writing vs. Frustration**: Programmers often write short prompts like `"no, run on port 3000"`. The heuristic analyzer looks for combinations of caps, repeated punctuation, and exasperation keywords before flagging frustration.
3. **Cultural Variations**: Emotional expressions in text vary across cultures and dialects; heuristics reflect common English conversational patterns.
4. **Host DOM Changes**: Web chat interfaces update frequently. Adapters are built with fallback selectors and **fail-open** architecture—if elements cannot be found, the extension becomes completely inert.
5. **NOT a Mental Health Tool**: Emotion Context provides formatting directives for language models. It is **not** a therapeutic or crisis-intervention application. In crisis scenarios, it displays an informational support banner and appends nothing.

---

## 🔒 Privacy & Safety Principles

- **Zero Project Servers:** We operate no backend servers, database, or API proxies.
- **Zero Telemetry:** No analytics, crash reporting, tracking cookies, or third-party SDKs.
- **Strictly Local by Default:** All tone heuristics execute synchronously on your machine with zero network calls.
- **No Message Persistence:** Your drafts and messages are never stored, logged, or recorded.
- **Minimal Permissions:** Only requests host permissions for supported chat websites and `storage` for extension configuration.

Read our complete policy in [PRIVACY.md](PRIVACY.md).

---

## 🧪 Testing & Quality Assurance

```bash
# Run unit & eval test suites
npm test

# Run TypeScript typechecker
npm run typecheck

# Run ESLint
npm run lint

# Check code formatting
npm run format:check
```

---

## 📄 License

Licensed under the [MIT License](LICENSE).
