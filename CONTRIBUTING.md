# Contributing to Emotion Context

Thank you for your interest in improving Emotion Context! We welcome contributions from developers, researchers, and users.

---

## Code of Conduct

Please maintain an inclusive, constructive, and respectful environment for all contributors.

---

## Development Setup

1. **Prerequisites:**
   - Node.js 20+ or 22+
   - npm 10+
2. **Clone & Install:**
   ```bash
   git clone https://github.com/Mukh74r/emotion-context.git
   cd emotion-context
   npm install
   ```
3. **Build Extension:**
   ```bash
   npm run build
   ```
4. **Run Tests:**
   ```bash
   npm test
   ```
5. **Run Lint & Typecheck:**
   ```bash
   npm run lint
   npm run typecheck
   ```

---

## Core Guidelines

1. **Strict Epistemic Guardrail:**
   Never submit PRs that instruct language models to "be gentle", "apologize", "comfort the user", or diagnose emotional states. All appended hints must instruct structural/formatting rules paired with the epistemic rigor clause.
2. **Privacy First:**
   Never introduce telemetry, remote analytics, third-party CDNs, or persistent logging of user message drafts.
3. **Fail-Open Adapters:**
   Any new or modified site adapter must fail open—if DOM queries return null, the extension must do nothing and allow standard page operation.
4. **Comprehensive Tests:**
   Every new heuristic, site adapter, or UI feature must include unit or integration tests in `tests/`.

---

## Submitting Pull Requests

1. Create a feature branch (`git checkout -b feature/my-site-adapter`).
2. Ensure `npm test`, `npm run lint`, and `npm run typecheck` pass.
3. Commit with concise, descriptive commit messages.
4. Open a Pull Request detailing the problem solved and test coverage.
