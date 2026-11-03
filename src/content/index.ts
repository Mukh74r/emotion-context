import { getAdapter, SiteAdapter } from '../adapters/index.js';
import { createAnalyzer } from '../analyzer/index.js';
import { AnalysisResult, Analyzer } from '../analyzer/types.js';
import { appendHintToDraft, buildHint, stripHintFromDraft } from '../hints/builder.js';
import {
  getSettings,
  isSiteEnabled,
  onSettingsChanged,
  saveSettings,
} from '../storage/settings.js';
import { ExtensionSettings } from '../storage/types.js';
import { ContentUI } from './ui.js';

export class ContentController {
  private adapter: SiteAdapter | null = null;
  private settings: ExtensionSettings | null = null;
  private analyzer: Analyzer | null = null;
  private ui: ContentUI | null = null;
  private inputElement: HTMLElement | null = null;
  private sendButton: HTMLElement | null = null;

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private latestResult: AnalysisResult | null = null;
  private pendingHint: string | null = null;
  private userDismissedHintForDraft = false;
  private lastDraftAnalyzed = '';
  private isSubmitting = false;

  public async init(): Promise<void> {
    try {
      this.adapter = getAdapter(window.location.href);
      if (!this.adapter) {
        // No adapter matches current URL -> fail open
        return;
      }

      this.settings = await getSettings();
      this.analyzer = createAnalyzer(this.settings);

      // Listen for settings changes
      onSettingsChanged((newSettings) => {
        this.settings = newSettings;
        this.analyzer = createAnalyzer(newSettings);
        this.updateUI();
      });

      // Listen for runtime messages (e.g. keyboard shortcut from background)
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.addListener((message) => {
          if (message?.action === 'TOGGLE_EXTENSION') {
            this.toggleEnabled();
          }
        });
      }

      // Attach global keyboard shortcut (Alt+Shift+E)
      window.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.altKey && e.shiftKey && e.code === 'KeyE') {
          e.preventDefault();
          this.toggleEnabled();
        }
      });

      // Find input element (retry briefly for SPA hydration)
      this.bindDOM();
    } catch {
      // Fail open on any error
    }
  }

  public bindDOM(): void {
    if (!this.adapter) return;

    this.inputElement = this.adapter.getInput();
    if (!this.inputElement) {
      // Retry for dynamically rendered SPAs
      const observer = new MutationObserver(() => {
        const el = this.adapter?.getInput();
        if (el) {
          observer.disconnect();
          this.inputElement = el;
          this.setupListeners();
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });
      return;
    }

    this.setupListeners();
  }

  private setupListeners(): void {
    if (!this.adapter || !this.inputElement) return;

    const container = this.adapter.getContainer() || this.inputElement.parentElement;
    if (container && !this.ui) {
      this.ui = new ContentUI(container, {
        onToggleEnabled: () => this.toggleEnabled(),
        onAcceptHint: (hint) => {
          this.pendingHint = hint;
          this.applyHintToInput();
        },
        onDismissHint: () => {
          this.pendingHint = null;
          this.userDismissedHintForDraft = true;
        },
      });
    }

    // Input listening (debounced)
    this.inputElement.addEventListener('input', () => this.onInputChanged());

    // Enter key interception
    this.inputElement.addEventListener(
      'keydown',
      (e: KeyboardEvent) => this.onKeyDown(e),
      true // capture phase
    );

    // Send button click interception
    this.sendButton = this.adapter.getSendButton();
    if (this.sendButton) {
      this.sendButton.addEventListener(
        'click',
        (e: MouseEvent) => this.onSendClicked(e),
        true // capture phase
      );
    }
  }

  private onInputChanged(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.analyzeCurrentDraft();
    }, 280);
  }

  private async analyzeCurrentDraft(): Promise<void> {
    if (!this.adapter || !this.settings || !this.analyzer) return;

    const isEnabled = isSiteEnabled(this.settings, window.location.hostname);
    if (!isEnabled) {
      this.ui?.updateIndicator(null, false, false);
      return;
    }

    const rawText = this.adapter.getText();
    const cleanDraft = stripHintFromDraft(rawText).trim();

    if (cleanDraft !== this.lastDraftAnalyzed) {
      this.lastDraftAnalyzed = cleanDraft;
      this.userDismissedHintForDraft = false;
    }

    if (!cleanDraft) {
      this.latestResult = null;
      this.pendingHint = null;
      this.ui?.updateIndicator(null, this.settings.enabled, true);
      this.ui?.hidePreview();
      return;
    }

    try {
      const result = await this.analyzer.analyze(cleanDraft);
      this.latestResult = result;
      this.ui?.updateIndicator(result, this.settings.enabled, true);

      if (result.state === 'distressed') {
        this.ui?.showDistressBanner();
        this.ui?.hidePreview();
        this.pendingHint = null;
        return;
      }

      this.ui?.hideDistressBanner();

      const directive = buildHint(result, cleanDraft);
      if (
        directive?.action === 'APPEND_HINT' &&
        directive.hint &&
        !this.userDismissedHintForDraft
      ) {
        this.pendingHint = directive.hint;
        if (this.settings.previewMode) {
          this.ui?.showPreview(directive.hint);
        }
      } else {
        this.pendingHint = null;
        this.ui?.hidePreview();
      }
    } catch {
      // Fail open
    }
  }

  private onKeyDown(e: KeyboardEvent): void {
    // IME composition support: do not intercept while IME composition is active
    if (e.isComposing || e.keyCode === 229) {
      return;
    }

    // Multi-line support: Shift+Enter should create a newline, not submit
    if (e.shiftKey) {
      return;
    }

    if (e.key === 'Enter') {
      this.handleSubmission();
    }
  }

  private onSendClicked(_e: MouseEvent): void {
    this.handleSubmission();
  }

  private handleSubmission(): void {
    if (this.isSubmitting) return;
    if (!this.adapter || !this.settings) return;

    const isEnabled = isSiteEnabled(this.settings, window.location.hostname);
    if (!isEnabled) {
      return; // Never modify messages when toggled off
    }

    // If distress flag is active: show banner, do NOT append anything, let send proceed
    if (this.latestResult?.state === 'distressed') {
      this.ui?.showDistressBanner();
      return;
    }

    // Check if there is an active hint to append
    const hintToAppend = this.ui?.getPendingHint() || this.pendingHint;
    if (hintToAppend && !this.userDismissedHintForDraft) {
      this.applyHintToInput(hintToAppend);
    }

    this.pendingHint = null;
    this.ui?.hidePreview();
  }

  private applyHintToInput(hint?: string): void {
    if (!this.adapter) return;
    const hintText = hint || this.pendingHint;
    if (!hintText) return;

    const currentText = this.adapter.getText();
    const cleanText = stripHintFromDraft(currentText);
    const updated = appendHintToDraft(cleanText, hintText);

    this.isSubmitting = true;
    this.adapter.setText(updated);
    this.isSubmitting = false;
  }

  private async toggleEnabled(): Promise<void> {
    if (!this.settings) return;
    const updated = await saveSettings({ enabled: !this.settings.enabled });
    this.settings = updated;
    this.updateUI();
  }

  private updateUI(): void {
    if (!this.settings) return;
    const isEnabled = isSiteEnabled(this.settings, window.location.hostname);
    this.ui?.updateIndicator(this.latestResult, this.settings.enabled, isEnabled);
    if (!isEnabled) {
      this.ui?.hidePreview();
      this.ui?.hideDistressBanner();
    }
  }
}

// Auto-boot content controller in browser environment
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const controller = new ContentController();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => controller.init());
  } else {
    controller.init();
  }
}
