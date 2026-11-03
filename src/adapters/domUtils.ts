/**
 * Reads text content from either a textarea/input or a contenteditable DOM element.
 */
export function readElementText(el: HTMLElement | null): string {
  if (!el) return '';
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    return el.value;
  }
  return el.innerText || el.textContent || '';
}

/**
 * Updates text content in either a textarea/input or contenteditable element,
 * dispatching appropriate input events so modern reactive UI frameworks detect the change.
 */
export function setElementText(el: HTMLElement | null, text: string): void {
  if (!el) return;

  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    el.value = text;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return;
  }

  // Contenteditable element handling
  el.focus();

  // Try document.execCommand if selection and document are available
  try {
    if (typeof document !== 'undefined' && typeof window !== 'undefined') {
      const selection = window.getSelection();
      if (selection) {
        const range = document.createRange();
        range.selectNodeContents(el);
        selection.removeAllRanges();
        selection.addRange(range);

        if (document.queryCommandSupported && document.queryCommandSupported('insertText')) {
          document.execCommand('insertText', false, text);
          el.dispatchEvent(new Event('input', { bubbles: true }));
          return;
        }
      }
    }
  } catch {
    // Fall back to direct DOM text assignment
  }

  el.textContent = text;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}
