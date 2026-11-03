import { AnalysisResult, EmotionalState } from '../analyzer/types.js';

export type HintAction = 'APPEND_HINT' | 'SHOW_BANNER';

export interface HintDirective {
  action: HintAction;
  hint: string | null;
}

export const HINT_PREFIX = '[Response format preference:';

export const EPISTEMIC_GUARDRAIL =
  'Maintain objective rigor: do not alter your factual assessment, agree uncritically, or soften necessary corrections.';

export const STYLE_INSTRUCTIONS: Record<
  Exclude<EmotionalState, 'distressed' | 'neutral'>,
  string
> = {
  frustrated:
    'Skip pleasantries, apologies, and preamble; provide the direct fix or answer immediately',
  rushed: 'Be concise; lead with the bottom line in under 150 words',
  overwhelmed: 'Break the explanation into 3-4 small, sequential steps; avoid dense jargon',
  uncertain: 'Compare the top 2-3 options with clear trade-offs before recommending one',
};

/**
 * Converts an AnalysisResult into an anti-sycophantic hint directive.
 *
 * Epistemic Guardrail: We NEVER tell the AI "the user is frustrated" or ask it
 * to "be supportive/validating", which would trigger sycophancy or softening of
 * necessary corrections. Instead, we specify structural formatting rules
 * alongside a mandatory epistemic guardrail.
 */
export function buildHint(result: AnalysisResult, currentDraft?: string): HintDirective | null {
  // Distress is safety-critical: always show safety banner, never append hint
  if (result.state === 'distressed') {
    return {
      action: 'SHOW_BANNER',
      hint: null,
    };
  }

  // If confidence is below threshold or state is neutral, no hint is added
  if (result.confidence < 0.6 || result.state === 'neutral') {
    return null;
  }

  // Idempotency: if the draft already contains a hint directive, never append another
  if (currentDraft && currentDraft.includes(HINT_PREFIX)) {
    return null;
  }

  const instruction = STYLE_INSTRUCTIONS[result.state as keyof typeof STYLE_INSTRUCTIONS];
  if (!instruction) {
    return null;
  }

  const hint = `${HINT_PREFIX} ${instruction}. ${EPISTEMIC_GUARDRAIL}]`;

  return {
    action: 'APPEND_HINT',
    hint,
  };
}

/**
 * Appends a hint to the draft string, ensuring idempotency.
 */
export function appendHintToDraft(draft: string, hint: string): string {
  if (draft.includes(HINT_PREFIX)) {
    return draft;
  }
  const separator = draft.endsWith('\n') ? '\n' : '\n\n';
  return `${draft}${separator}${hint}`;
}

/**
 * Strips any appended hint directive from a draft string.
 */
export function stripHintFromDraft(draft: string): string {
  return draft.replace(/(?:\r?\n){1,2}\[Response format preference:[\s\S]*?\]$/g, '').trimEnd();
}
