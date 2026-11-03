# Chrome Web Store Privacy Practices Justification

This document provides the single-purpose description and technical justification for each requested permission in Emotion Context (`manifest.json`), following the Chrome Web Store Developer Program Policies.

---

## Single Purpose Description

Emotion Context analyzes the emotional tone of draft messages in supported AI chat interfaces (ChatGPT, Claude, Gemini) and appends concise, anti-sycophantic formatting directives so language models deliver objective, direct, and well-structured answers without conversational filler or sycophancy.

---

## Permission Justifications

### 1. `storage`

- **Purpose:** Used strictly to persist user preferences locally on the client machine via `chrome.storage.local`.
- **Data Stored:**
  - `enabled`: Global toggle state (boolean).
  - `previewMode`: Preference for showing the preview box (boolean).
  - `siteSettings`: Per-site enable/disable map (`chatgpt.com`, `claude.ai`, `gemini.google.com`).
  - `analyzerMode`: Mode selection (`local` or optional `llm`).
  - `apiKey`: User-entered personal API key (stored locally only if optional LLM mode is enabled).
  - `apiEndpoint` and `modelName`: Custom endpoint settings.
- **Justification:** Without `storage`, user configuration and site preferences would reset every time the browser restarts.
- **Privacy Assurance:** Message drafts, chat logs, tone analysis scores, and prompt content are **never** persisted to storage.

---

## Host Permissions Justifications

### 1. `https://chatgpt.com/*`

- **Purpose:** Required for the content script to detect the chat input textarea/contenteditable element on ChatGPT, evaluate the draft locally, render the floating tone indicator, and append formatting directives upon message submission.
- **Data Handling:** Content script reads the draft text in browser memory for tone evaluation. No data is transmitted externally.

### 2. `https://claude.ai/*`

- **Purpose:** Required for the content script to interact with Claude's ProseMirror editor on `claude.ai`, display the tone preview, and append formatting directives.
- **Data Handling:** Ephemeral local in-memory evaluation only. No data is transmitted externally.

### 3. `https://gemini.google.com/*`

- **Purpose:** Required for the content script to interact with Gemini's Quill/rich-textarea input container on `gemini.google.com`, display the tone preview, and append formatting directives.
- **Data Handling:** Ephemeral local in-memory evaluation only. No data is transmitted externally.

---

## Permissions Explicitly Avoided

- **`<all_urls>`:** Refused. The extension only requests access to the three specific AI chat platforms it supports.
- **`tabs`:** Refused. The extension does not inspect tab browsing history, tab titles, or URLs of other open pages.
- **`history`:** Refused. The extension requires no access to browser history.
- **`webRequest` / `declarativeNetRequest`:** Refused. The extension does not intercept or inspect network requests.
- **`cookies`:** Refused. No access to browser authentication tokens or cookies.

---

## Data Usage Compliance Certification

1. **No Sale of Data:** We do not sell, rent, or monetize user data.
2. **No Data Transferred for Tracking:** We do not transfer user data for advertising, creditworthiness, or tracking purposes.
3. **No Lending or Financial Use:** We do not use or transfer user data to determine creditworthiness or for lending.
4. **Local Execution:** By default, all analysis occurs 100% on-device with zero network transmissions.
