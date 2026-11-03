# Chrome Web Store Listing Description: Emotion Context

## Extension Title

Emotion Context — Anti-Sycophancy AI Tone Directives

## Summary (Max 132 chars)

Analyzes draft message emotional tone in AI chats and appends objective formatting directives for concise, accurate responses.

## Detailed Description

Tired of AI chatbots offering excessive apologies, sycophantic praise, or conversational filler when you're frustrated, in a hurry, or overwhelmed?

**Emotion Context** is a lightweight, open-source, privacy-first browser extension that analyzes the emotional tone and posture of your draft message in real-time. Just before sending, it appends an objective formatting preference with an epistemic rigor guardrail so models respond concisely and accurately without softening corrections or appeasing.

### 🧭 Key Features

- **Real-Time On-Device Analysis:** Detects frustrated, rushed, overwhelmed, uncertain, or distressed signals locally as you type.
- **Anti-Sycophancy Guardrail:** Unlike generic prompt tools that tell the AI "the user is upset" (triggering model sycophancy and inaccurate concessions), Emotion Context enforces structural formatting rules:
  - _Frustrated:_ Skip pleasantries and apologies; provide direct fix immediately.
  - _Rushed:_ Lead with the bottom line in under 150 words.
  - _Overwhelmed:_ Break explanations into 3-4 sequential steps without dense jargon.
  - _Uncertain:_ Compare top 2-3 options with trade-offs before recommending.
- **Floating Tone Indicator:** Non-intrusive badge showing detected tone (e.g., "Tone: frustrated, 82%") with a one-click toggle.
- **Preview Mode (Default ON):** Review, adjust, or discard the suggested formatting directive directly beneath the chat input before sending.
- **Keyboard Shortcut:** Toggle on/off instantly with `Alt+Shift+E`.
- **Fail-Open Architecture:** If a website changes its DOM, the extension gracefully steps aside. The chat interface continues working normally.

### 🔒 Privacy & Safety First

- **Zero remote servers:** We operate no backend servers or databases.
- **Zero telemetry:** No tracking, no analytics, no third-party scripts.
- **Zero message storage:** Drafts and analyses are evaluated ephemerally in browser memory and discarded. Nothing is logged or saved to disk.
- **Default 100% Local:** Zero network requests in standard mode.
- **Optional LLM Mode:** Paste your personal API key to run model-based analysis; your key is stored locally in `chrome.storage.local`.

### 🌐 Supported Sites

- ChatGPT (chatgpt.com)
- Claude (claude.ai)
- Google Gemini (gemini.google.com)

### 📄 Open Source

Licensed under MIT. Source code: https://github.com/Mukh74r/emotion-context
