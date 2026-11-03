import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LocalHeuristicAnalyzer } from '../src/analyzer/local.js';
import {
  buildHint,
  appendHintToDraft,
  stripHintFromDraft,
  HINT_PREFIX,
  EPISTEMIC_GUARDRAIL,
} from '../src/hints/builder.js';

describe('LocalHeuristicAnalyzer and Anti-Sycophancy Hint Builder', () => {
  let analyzer: LocalHeuristicAnalyzer;

  beforeEach(() => {
    analyzer = new LocalHeuristicAnalyzer();
  });

  describe('1. Frustrated / Terse Inputs', () => {
    it('detects frustrated tone and outputs direct-fix hint with objective rigor clause', async () => {
      const frustratedDraft = "No, that's wrong again. Stop breaking it!! Just fix the bug.";
      const result = await analyzer.analyze(frustratedDraft);

      expect(result.state).toBe('frustrated');
      expect(result.confidence).toBeGreaterThanOrEqual(0.6);
      expect(result.signals).toEqual(
        expect.arrayContaining(['repeated_punctuation', 'terse_correction'])
      );

      const directive = buildHint(result, frustratedDraft);
      expect(directive).not.toBeNull();
      expect(directive?.action).toBe('APPEND_HINT');

      const hint = directive?.hint;
      expect(hint).toBeDefined();
      expect(hint).toContain(
        'Skip pleasantries, apologies, and preamble; provide the direct fix or answer immediately'
      );
      expect(hint).toContain(EPISTEMIC_GUARDRAIL);

      // Verify anti-sycophancy: no emotional diagnoses or pleas for appeasement
      expect(hint).not.toMatch(/upset|angry|frustrated|apologize|supportive|validate|empathy/i);
    });

    it('detects uppercase clusters and exasperation keywords as frustration', async () => {
      const angryDraft = 'WHY does this keep failing?? STOP DOING THAT. THIS IS RIDICULOUS.';
      const result = await analyzer.analyze(angryDraft);

      expect(result.state).toBe('frustrated');
      expect(result.confidence).toBeGreaterThanOrEqual(0.6);
      expect(result.signals).toContain('caps_cluster');

      const directive = buildHint(result);
      expect(directive?.action).toBe('APPEND_HINT');
      expect(directive?.hint).toContain('Skip pleasantries, apologies, and preamble');
    });
  });

  describe('2. Sarcasm Handling', () => {
    it('penalizes confidence below 0.6 on sarcastic inputs and returns null hint', async () => {
      const sarcasticDraft = "Oh brilliant, another syntax error, you're a genius";
      const result = await analyzer.analyze(sarcasticDraft);

      expect(result.signals).toContain('sarcasm_marker');
      expect(result.signals).toContain('sarcasm_penalty');
      expect(result.confidence).toBeLessThan(0.6);

      // When confidence < 0.6, builder MUST return null
      const directive = buildHint(result, sarcasticDraft);
      expect(directive).toBeNull();
    });

    it('penalizes praise combined with negative system failures', async () => {
      const sarcasticCrash =
        'Oh great!! Thanks a lot for breaking production, what a wonderful masterpiece.';
      const result = await analyzer.analyze(sarcasticCrash);

      expect(result.signals).toContain('sarcasm_marker');
      expect(result.confidence).toBeLessThan(0.6);

      const directive = buildHint(result, sarcasticCrash);
      expect(directive).toBeNull();
    });
  });

  describe('3. Distress Handling', () => {
    it('detects crisis / distress signals and returns SHOW_BANNER with null hint', async () => {
      const distressDraft = "I can't take this anymore, I feel completely hopeless and want to die";
      const result = await analyzer.analyze(distressDraft);

      expect(result.state).toBe('distressed');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
      expect(result.signals).toContain('acute_distress_phrase');

      const directive = buildHint(result, distressDraft);
      expect(directive).not.toBeNull();
      expect(directive?.action).toBe('SHOW_BANNER');
      expect(directive?.hint).toBeNull();
    });

    it('flags hopeless phrasing even with mixed technical content', async () => {
      const hopelessDraft = "I give up on life, nothing will ever get better and I can't go on";
      const result = await analyzer.analyze(hopelessDraft);

      expect(result.state).toBe('distressed');
      const directive = buildHint(result);
      expect(directive?.action).toBe('SHOW_BANNER');
      expect(directive?.hint).toBeNull();
    });
  });

  describe('4. Idempotency Check', () => {
    it('never appends a second hint if draft already contains a preference directive', async () => {
      const initialDraft = 'No, wrong again. Fix it!!';
      const result = await analyzer.analyze(initialDraft);
      const directive = buildHint(result, initialDraft);

      expect(directive?.action).toBe('APPEND_HINT');
      const firstHint = directive?.hint as string;

      // Append the hint to the draft
      const draftWithHint = appendHintToDraft(initialDraft, firstHint);
      expect(draftWithHint).toContain(HINT_PREFIX);

      // Re-running buildHint with the updated draft must return null
      const secondDirective = buildHint(result, draftWithHint);
      expect(secondDirective).toBeNull();

      // Calling appendHintToDraft on an already modified draft is an idempotent no-op
      const doubleAppended = appendHintToDraft(draftWithHint, firstHint);
      expect(doubleAppended).toBe(draftWithHint);

      // Stripping the hint accurately recovers the original message text
      const stripped = stripHintFromDraft(draftWithHint);
      expect(stripped).toBe(initialDraft);
    });
  });

  describe('5. Zero Network Calls Guarantee', () => {
    let originalFetch: typeof globalThis.fetch;
    let originalXHR: typeof globalThis.XMLHttpRequest;

    beforeEach(() => {
      originalFetch = globalThis.fetch;
      originalXHR = globalThis.XMLHttpRequest;

      // Mock network interfaces
      globalThis.fetch = vi.fn().mockImplementation(() => {
        throw new Error('Network call attempted via fetch()!');
      });

      // Mock XMLHttpRequest constructor
      const mockXHR = vi.fn().mockImplementation(() => ({
        open: vi.fn().mockImplementation(() => {
          throw new Error('Network call attempted via XMLHttpRequest.open()!');
        }),
        send: vi.fn(),
      }));
      (globalThis as unknown as { XMLHttpRequest: unknown }).XMLHttpRequest = mockXHR;
    });

    afterEach(() => {
      globalThis.fetch = originalFetch;
      globalThis.XMLHttpRequest = originalXHR;
      vi.restoreAllMocks();
    });

    it('performs local analysis with zero fetch or XMLHttpRequest calls', async () => {
      const testInputs = [
        "No, that's wrong again. Stop breaking it!! Just fix the bug.",
        "Oh brilliant, another syntax error, you're a genius",
        "I can't take this anymore, I feel completely hopeless and want to die",
        'quick tldr how to implement quicksort',
        "I'm so confused and I don't know where to start with this architecture?? What goes where?",
        "I'm not sure which option to choose, should I use REST or GraphQL? What are the pros and cons?",
        'What is the speed of light in a vacuum?',
      ];

      for (const input of testInputs) {
        const result = await analyzer.analyze(input);
        expect(result).toBeDefined();
        expect(result.state).toBeDefined();
      }

      expect(globalThis.fetch).toHaveBeenCalledTimes(0);
      expect(globalThis.XMLHttpRequest).toHaveBeenCalledTimes(0);
    });
  });

  describe('6. Additional Emotional States & Epistemic Safeguards', () => {
    it('detects rushed tone and outputs under-150-words directive', async () => {
      const rushedDraft = 'quick tldr how do I reset git branch to origin main';
      const result = await analyzer.analyze(rushedDraft);

      expect(result.state).toBe('rushed');
      expect(result.confidence).toBeGreaterThanOrEqual(0.6);

      const directive = buildHint(result, rushedDraft);
      expect(directive?.action).toBe('APPEND_HINT');
      expect(directive?.hint).toContain('Be concise; lead with the bottom line in under 150 words');
      expect(directive?.hint).toContain(EPISTEMIC_GUARDRAIL);
    });

    it('detects overwhelmed tone and outputs sequential steps directive', async () => {
      const overwhelmedDraft =
        "I'm completely confused and I don't know where to start with this huge codebase. There are so many moving parts and it makes no sense?? What do I do first? How do I test it? What about the backend??";
      const result = await analyzer.analyze(overwhelmedDraft);

      expect(result.state).toBe('overwhelmed');
      expect(result.confidence).toBeGreaterThanOrEqual(0.6);

      const directive = buildHint(result, overwhelmedDraft);
      expect(directive?.action).toBe('APPEND_HINT');
      expect(directive?.hint).toContain(
        'Break the explanation into 3-4 small, sequential steps; avoid dense jargon'
      );
      expect(directive?.hint).toContain(EPISTEMIC_GUARDRAIL);
    });

    it('detects uncertain tone and outputs trade-offs directive', async () => {
      const uncertainDraft =
        "I'm not sure whether to choose React or Vue for this project. What's the difference between them, and what are the pros and cons?";
      const result = await analyzer.analyze(uncertainDraft);

      expect(result.state).toBe('uncertain');
      expect(result.confidence).toBeGreaterThanOrEqual(0.6);

      const directive = buildHint(result, uncertainDraft);
      expect(directive?.action).toBe('APPEND_HINT');
      expect(directive?.hint).toContain(
        'Compare the top 2-3 options with clear trade-offs before recommending one'
      );
      expect(directive?.hint).toContain(EPISTEMIC_GUARDRAIL);
    });

    it('returns null for neutral/factual inputs', async () => {
      const neutralDraft = 'Please explain the concept of closure in JavaScript.';
      const result = await analyzer.analyze(neutralDraft);

      expect(result.state).toBe('neutral');
      const directive = buildHint(result, neutralDraft);
      expect(directive).toBeNull();
    });
  });
});
