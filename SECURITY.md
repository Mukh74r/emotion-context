# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

---

## Reporting a Vulnerability

We take the security and privacy of Emotion Context users seriously. If you discover a security vulnerability or privacy flaw:

1. **Do not create a public GitHub issue.**
2. Send a detailed report via GitHub Security Advisories or email the maintainer directly.
3. Include:
   - Steps to reproduce the issue.
   - Proof-of-concept code or sample drafts if applicable.
   - Affected browser, operating system, and extension version.

You will receive an acknowledgment within 48 hours and regular updates until resolution.

---

## Security Architecture Principles

- **No Third-Party Scripts:** Emotion Context builds all dependencies from source via Vite into clean bundles with no remote script evaluation (`unsafe-eval` is forbidden in Manifest V3).
- **Minimum Permissions:** The extension requests only `storage` and host permissions for the three supported AI chat domains.
- **Local Storage Boundaries:** User API keys (when entered for optional LLM mode) are stored strictly within `chrome.storage.local`, which is sandboxed per-extension by the browser and inaccessible to web pages or other extensions.
- **Fail-Open Isolation:** Site DOM adapters run with defensive try-catches and boundary checks to guarantee host page accessibility and functionality.
