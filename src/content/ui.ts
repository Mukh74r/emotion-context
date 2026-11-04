import { AnalysisResult } from '../analyzer/types.js';

export interface UIOptions {
  onToggleEnabled: () => void;
  onAcceptHint: (hint: string) => void;
  onDismissHint: () => void;
}

export class ContentUI {
  private container: HTMLElement;
  private badgeElement: HTMLElement | null = null;
  private previewElement: HTMLElement | null = null;
  private bannerElement: HTMLElement | null = null;
  private currentHintText: string = '';
  private options: UIOptions;

  constructor(targetContainer: HTMLElement, options: UIOptions) {
    this.options = options;
    this.container = document.createElement('div');
    this.container.className = 'ec-root';

    // Insert as first child or append to targetContainer
    if (targetContainer.firstChild) {
      targetContainer.insertBefore(this.container, targetContainer.firstChild);
    } else {
      targetContainer.appendChild(this.container);
    }

    this.renderBadge('neutral', 0, true);
  }

  public updateIndicator(
    result: AnalysisResult | null,
    isEnabled: boolean,
    isSiteEnabled: boolean
  ): void {
    const active = isEnabled && isSiteEnabled;
    if (!active) {
      this.renderBadge('neutral', 0, false);
      this.hidePreview();
      return;
    }

    if (!result) {
      this.renderBadge('neutral', 0, true);
      return;
    }

    this.renderBadge(result.state, result.confidence, true);
  }

  public showPreview(hintText: string): void {
    this.currentHintText = hintText;

    if (!this.previewElement) {
      this.previewElement = document.createElement('div');
      this.previewElement.className = 'ec-preview-box';
      this.container.appendChild(this.previewElement);
    }

    this.previewElement.innerHTML = `
      <div class="ec-preview-header">
        <span>Suggested Tone Instruction</span>
        <span>Anti-Sycophancy Active</span>
      </div>
      <textarea class="ec-preview-textarea" aria-label="Edit tone hint">${this.escapeHtml(
        hintText
      )}</textarea>
      <div class="ec-preview-actions">
        <button type="button" class="ec-btn ec-btn-secondary ec-btn-remove">Remove</button>
        <button type="button" class="ec-btn ec-btn-primary ec-btn-accept">Accept</button>
      </div>
    `;

    const textarea = this.previewElement.querySelector<HTMLTextAreaElement>('.ec-preview-textarea');
    const removeBtn = this.previewElement.querySelector<HTMLButtonElement>('.ec-btn-remove');
    const acceptBtn = this.previewElement.querySelector<HTMLButtonElement>('.ec-btn-accept');

    if (textarea) {
      textarea.addEventListener('input', () => {
        this.currentHintText = textarea.value;
      });
    }

    if (removeBtn) {
      removeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.hidePreview();
        this.options.onDismissHint();
      });
    }

    if (acceptBtn) {
      acceptBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const finalHint = textarea ? textarea.value.trim() : this.currentHintText;
        this.options.onAcceptHint(finalHint);
        this.hidePreview();
      });
    }
  }

  public hidePreview(): void {
    if (this.previewElement) {
      this.previewElement.remove();
      this.previewElement = null;
    }
  }

  public getPendingHint(): string | null {
    return this.previewElement ? this.currentHintText : null;
  }

  public showDistressBanner(): void {
    if (this.bannerElement) return;

    this.bannerElement = document.createElement('div');
    this.bannerElement.className = 'ec-distress-banner';
    this.bannerElement.setAttribute('role', 'alert');
    this.bannerElement.innerHTML = `
      <div class="ec-distress-banner-content">
        <span class="ec-distress-icon" aria-hidden="true">💙</span>
        <span>This sounds heavy. If you're struggling, talking to someone you trust or a professional can help.</span>
      </div>
      <button type="button" class="ec-distress-dismiss-btn" aria-label="Dismiss banner">&times;</button>
    `;

    const dismissBtn = this.bannerElement.querySelector<HTMLButtonElement>(
      '.ec-distress-dismiss-btn'
    );
    if (dismissBtn) {
      dismissBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.hideDistressBanner();
      });
    }

    this.container.appendChild(this.bannerElement);
  }

  public hideDistressBanner(): void {
    if (this.bannerElement) {
      this.bannerElement.remove();
      this.bannerElement = null;
    }
  }

  public getContainerElement(): HTMLElement {
    return this.container;
  }

  public destroy(): void {
    this.container.remove();
  }

  private renderBadge(state: string, confidence: number, active: boolean): void {
    if (!this.badgeElement) {
      this.badgeElement = document.createElement('div');
      this.container.appendChild(this.badgeElement);
    }

    const stateClass = `ec-state-${state}`;
    this.badgeElement.className = `ec-floating-badge ${
      active ? 'ec-active' : 'ec-disabled'
    } ${stateClass}`;

    let label = 'Tone: off';
    if (active) {
      if (state === 'neutral' || confidence < 0.2) {
        label = 'Tone: neutral';
      } else {
        const percent = Math.round(confidence * 100);
        label = `Tone: ${state}, ${percent}%`;
      }
    }

    const toggleText = active ? 'turn off' : 'turn on';

    this.badgeElement.innerHTML = `
      <span class="ec-badge-dot" aria-hidden="true"></span>
      <span class="ec-badge-label">${label}</span>
      <button type="button" class="ec-badge-toggle-btn" aria-label="${toggleText}">${toggleText}</button>
    `;

    const toggleBtn = this.badgeElement.querySelector<HTMLButtonElement>('.ec-badge-toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.options.onToggleEnabled();
      });
    }
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
