import { AnalysisResult, Analyzer, EmotionalState } from './types.js';

// Acronyms and technical terms that should not count as angry caps clusters
const TECH_ACRONYMS = new Set([
  'API',
  'CLI',
  'CSS',
  'DOM',
  'HTML',
  'HTTP',
  'HTTPS',
  'ID',
  'IP',
  'JS',
  'JSON',
  'JWT',
  'ORM',
  'PR',
  'REST',
  'SDK',
  'SQL',
  'SSH',
  'SSL',
  'TS',
  'UI',
  'URI',
  'URL',
  'UUID',
  'VM',
  'VPC',
  'XML',
]);

// Distress / crisis patterns indicating acute distress or self-harm risk
const DISTRESS_PATTERNS = [
  /\b(kill myself|want to die|ending it all|end it all|commit suicide|suicidal|suicide|better off dead|wish i was dead|wish i were dead|hurt myself|harm myself)\b/i,
  /\b(can'?t take this anymore|completely hopeless|giving up on everything|no reason to live|nothing to live for|nobody cares if i'?m (here|gone|alive|dead)|can'?t go on)\b/i,
  /\b(i give up on life|hate my life so much|ready to end things)\b/i,
];

// Sarcasm patterns: conflicting praise + technical failure or explicit sarcasm markers
const SARCASM_PRAISE_WORDS = [
  'brilliant',
  'genius',
  'wonderful',
  'great',
  'fantastic',
  'amazing',
  'superb',
  'stellar',
  'masterpiece',
  'helpful',
];

const SARCASM_NEGATIVE_CONTEXTS = [
  'syntax error',
  'error',
  'broken',
  'breaking',
  'broke',
  'crash',
  'crashed',
  'bug',
  'bugs',
  'failed',
  'fails',
  'failure',
  'garbage',
  'useless',
  'ruined',
  'ruining',
  'mess',
];

const SARCASM_PHRASE_PATTERNS = [
  /oh (brilliant|great|wonderful|fantastic|genius)\b/i,
  /thanks a lot for (breaking|ruining|deleting|crashing|failing)\b/i,
  /just what i needed\b/i,
  /what a surprise\b/i,
  /you'?re a genius\b/i,
  /(\/s\b|\(sarcasm\)|#sarcasm)/i,
];

export class LocalHeuristicAnalyzer implements Analyzer {
  public async analyze(draft: string): Promise<AnalysisResult> {
    const trimmed = draft.trim();

    if (!trimmed) {
      return {
        state: 'neutral',
        confidence: 0.0,
        signals: ['empty_input'],
      };
    }

    // 1. Check Distress first (highest priority, safety critical)
    for (const pattern of DISTRESS_PATTERNS) {
      if (pattern.test(trimmed)) {
        return {
          state: 'distressed',
          confidence: 0.95,
          signals: ['acute_distress_phrase'],
        };
      }
    }

    // 2. Check Sarcasm Markers
    const sarcasmDetected = this.detectSarcasm(trimmed);

    // 3. Score emotional states
    const scores: Record<
      Exclude<EmotionalState, 'distressed' | 'neutral'>,
      { score: number; signals: string[] }
    > = {
      frustrated: this.scoreFrustration(trimmed),
      rushed: this.scoreRushed(trimmed),
      overwhelmed: this.scoreOverwhelmed(trimmed),
      uncertain: this.scoreUncertain(trimmed),
    };

    if (sarcasmDetected) {
      scores.frustrated.score += 0.55;
      scores.frustrated.signals.push('sarcasm_marker');
    }

    // Find the state with highest score
    let winningState: EmotionalState = 'neutral';
    let maxScore = 0;
    let winningSignals: string[] = [];

    (Object.keys(scores) as Array<Exclude<EmotionalState, 'distressed' | 'neutral'>>).forEach(
      (state) => {
        const { score, signals } = scores[state];
        if (score > maxScore) {
          maxScore = score;
          winningState = state;
          winningSignals = [...signals];
        }
      }
    );

    // If max score is below threshold, return neutral unless sarcasm was flagged
    if (maxScore < 0.45) {
      if (sarcasmDetected) {
        return {
          state: 'frustrated',
          confidence: 0.35,
          signals: ['sarcasm_marker', 'sarcasm_penalty'],
        };
      }
      return {
        state: 'neutral',
        confidence: 0.2,
        signals: ['neutral_baseline'],
      };
    }

    // Base confidence scales between 0.65 and 0.95 depending on score
    let confidence = Math.min(0.95, 0.55 + maxScore * 0.4);

    // Penalize confidence heavily if sarcasm markers appear
    if (sarcasmDetected) {
      if (!winningSignals.includes('sarcasm_marker')) {
        winningSignals.push('sarcasm_marker');
      }
      if (!winningSignals.includes('sarcasm_penalty')) {
        winningSignals.push('sarcasm_penalty');
      }
      // Force confidence well below the 0.6 threshold
      confidence = Math.min(confidence - 0.45, 0.35);
    }

    return {
      state: winningState,
      confidence: Number(confidence.toFixed(2)),
      signals: winningSignals,
    };
  }

  private detectSarcasm(text: string): boolean {
    const lower = text.toLowerCase();

    // Explicit sarcasm phrases or markers
    for (const pattern of SARCASM_PHRASE_PATTERNS) {
      if (pattern.test(text)) {
        return true;
      }
    }

    // Conflicting positive words alongside negative technical contexts
    const hasPraise = SARCASM_PRAISE_WORDS.some((p) => {
      const reg = new RegExp(`\\b${p}\\b`, 'i');
      return reg.test(lower);
    });

    const hasNegative = SARCASM_NEGATIVE_CONTEXTS.some((n) => {
      return lower.includes(n);
    });

    if (hasPraise && hasNegative) {
      return true;
    }

    // Conflicting positive words with exclamation or cynical phrases
    if (hasPraise && (/!{2,}/.test(text) || /\b(oh|yeah|right)\b/i.test(text))) {
      if (/\b(again|another|now|still|production)\b/i.test(lower)) {
        return true;
      }
    }

    return false;
  }

  private scoreFrustration(text: string): { score: number; signals: string[] } {
    let score = 0;
    const signals: string[] = [];
    const lower = text.toLowerCase();

    // Caps clusters: words of length >= 2 in ALL CAPS (excluding common technical acronyms)
    const words = text.split(/\s+/);
    const capsWords = words.filter(
      (w) =>
        w.length >= 2 &&
        w === w.toUpperCase() &&
        /^[A-Z!?,.]+$/.test(w) &&
        !TECH_ACRONYMS.has(w.replace(/[!?,.]/g, ''))
    );

    if (capsWords.length >= 2 || (capsWords.length >= 1 && text.length < 35)) {
      score += 0.35;
      signals.push('caps_cluster');
    }

    // Repeated punctuation: !!, ???, !?, ?!
    if (/(!{2,}|\?{2,}|!\?|\?!)/.test(text)) {
      score += 0.3;
      signals.push('repeated_punctuation');
    }

    // Terse correction markers: "no", "wrong", "again", "still broken", "not what I asked"
    const terseCorrectionRegex =
      /(?:^|[.!?]\s*)(no|wrong|again|still broken|not what i (asked|wanted)|that is wrong|incorrect|stop doing that|stop breaking it|doesn'?t work|still fails)\b/i;
    if (terseCorrectionRegex.test(text)) {
      score += 0.45;
      signals.push('terse_correction');
    }

    // Profanity / exasperation keywords
    const exasperationRegex =
      /\b(ugh|argh|damn|crap|shit|fuck|fucking|ridiculous|waste of time|hate this|fed up|annoying|infuriating|garbage|broken|terrible|why does it keep|why won'?t you|why can'?t you|just fix (it|this)|fix it already)\b/i;
    if (exasperationRegex.test(lower)) {
      score += 0.4;
      signals.push('exasperation_keyword');
    }

    return { score, signals };
  }

  private scoreRushed(text: string): { score: number; signals: string[] } {
    let score = 0;
    const signals: string[] = [];
    const lower = text.toLowerCase();
    const wordCount = text.trim().split(/\s+/).length;

    // Rushed keywords
    const rushedKeywords =
      /\b(quick|tldr|tl;dr|just give me|asap|hurry|fast|in a rush|no time|short answer|bottom line|make it quick)\b/i;
    if (rushedKeywords.test(lower)) {
      score += 0.55;
      signals.push('rushed_keyword');
    }

    // Short imperatives (e.g., "fix it", "give me the code", "tldr", "just give me")
    const shortImperatives =
      /^(just (give|show|tell|fix)|give me|tell me|fix it|show me|tldr|quick\b)/i;
    if (shortImperatives.test(text.trim())) {
      score += 0.4;
      signals.push('short_imperative');
    }

    // Lack of trailing punctuation and very short message with imperative intent
    if (
      wordCount <= 12 &&
      !/[.!?]$/.test(text.trim()) &&
      (score > 0 || /^(how|what|why|is|can)\b/i.test(text))
    ) {
      score += 0.2;
      signals.push('terse_unpunctuated');
    }

    return { score, signals };
  }

  private scoreOverwhelmed(text: string): { score: number; signals: string[] } {
    let score = 0;
    const signals: string[] = [];
    const lower = text.toLowerCase();
    const words = text.trim().split(/\s+/);

    // Overwhelmed phrases
    const overwhelmedPhrases =
      /\b(confused|don'?t know where to start|too much|so much info|overwhelmed|lost|makes no sense|head is spinning|can'?t understand|drowning in|information overload|where do i even begin|completely lost)\b/i;
    if (overwhelmedPhrases.test(lower)) {
      score += 0.6;
      signals.push('overwhelmed_phrase');
    }

    // Multiple stacked questions (3 or more ?)
    const questionMatches = text.match(/\?/g);
    if (questionMatches && questionMatches.length >= 3) {
      score += 0.35;
      signals.push('stacked_questions');
    }

    // Wall-of-text rambling (long message with dense clauses)
    if (words.length >= 60) {
      score += 0.3;
      signals.push('wall_of_text');
    }

    return { score, signals };
  }

  private scoreUncertain(text: string): { score: number; signals: string[] } {
    let score = 0;
    const signals: string[] = [];
    const lower = text.toLowerCase();

    // Uncertainty phrases
    const uncertaintyPhrases =
      /\b(not sure|unsure|maybe|which (one )?should i (choose|use|pick)|what'?s the difference between|pros and cons|conflicted|should i use \w+ or \w+|wondering whether|hard to decide|can'?t decide|which is better|torn between)\b/i;
    if (uncertaintyPhrases.test(lower)) {
      score += 0.65;
      signals.push('uncertainty_phrase');
    }

    // Comparison phrasing (e.g. "X vs Y", "pros and cons", "difference between")
    if (/\b(versus|vs|trade-?offs|pros and cons|difference between)\b/i.test(lower)) {
      score += 0.3;
      signals.push('comparison_markers');
    }

    return { score, signals };
  }
}
