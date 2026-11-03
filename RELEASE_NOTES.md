# Emotion Context v0.1.0 (Initial Release)

**Emotion Context** is an open-source, privacy-first Manifest V3 browser extension that analyzes the emotional tone and conversational posture of message drafts in AI chats and appends objective, anti-sycophantic formatting directives so models provide concise, structured, and factual answers without appeasing or validating.

---

### 🚀 Key Highlights

- **Anti-Sycophancy Formatting Engine:** Converts detected frustration, urgency, confusion, or uncertainty into structural formatting constraints paired with an explicit epistemic guardrail (`Maintain objective rigor: do not alter your factual assessment, agree uncritically, or soften necessary corrections.`).
- **100% On-Device Local Heuristics:** Zero network calls in default mode. Employs regex patterns, caps clusters, punctuation repetition, and heavy sarcasm penalties ($< 0.6$ confidence).
- **Isolated DOM Adapters:** Dedicated adapters for **ChatGPT**, **Claude**, and **Google Gemini** that fail open gracefully if host DOM structures change.
- **Floating Tone Indicator & Preview:** Non-intrusive in-page badge displaying real-time tone and confidence with a one-click toggle, plus an editable preview bar under the chat input.
- **Safety Banner:** Automatically presents an informational support banner with a dismiss button when acute distress is detected; never blocks prompt submission and appends nothing.
- **Minimal Permissions:** Manifest V3 compliant. Requests only `storage` and host permissions for the three supported AI platforms. No `<all_urls>`, no `tabs`, no `history`.

---

### 📦 Installation

1. Download `emotion-context-v0.1.0.zip` below and unzip it.
2. In Chrome or Edge, navigate to `chrome://extensions/` or `edge://extensions/`.
3. Enable **Developer mode** in the top-right corner.
4. Click **Load unpacked** and select the unzipped directory.
