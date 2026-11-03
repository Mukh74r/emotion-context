export interface SiteAdapter {
  readonly id: string;
  readonly name: string;
  matches(url: string): boolean;
  getInput(): HTMLElement | null;
  getText(): string;
  setText(text: string): void;
  getSendButton(): HTMLElement | null;
  getContainer(): HTMLElement | null;
}
