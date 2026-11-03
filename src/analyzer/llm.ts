import { LocalHeuristicAnalyzer } from './local.js';
import { AnalysisResult, Analyzer, EmotionalState } from './types.js';

export interface LLMAnalyzerOptions {
  apiKey: string;
  apiEndpoint?: string;
  modelName?: string;
}

export class LLMAnalyzer implements Analyzer {
  private fallbackAnalyzer = new LocalHeuristicAnalyzer();
  private apiKey: string;
  private apiEndpoint: string;
  private modelName: string;

  constructor(options: LLMAnalyzerOptions) {
    this.apiKey = options.apiKey;
    this.apiEndpoint = options.apiEndpoint || 'https://api.openai.com/v1/chat/completions';
    this.modelName = options.modelName || 'gpt-4o-mini';
  }

  public async analyze(draft: string): Promise<AnalysisResult> {
    const trimmed = draft.trim();
    if (!trimmed) {
      return {
        state: 'neutral',
        confidence: 0.0,
        signals: ['empty_input'],
      };
    }

    // If no API key is set, fall back to local analyzer
    if (!this.apiKey) {
      return this.fallbackAnalyzer.analyze(draft);
    }

    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.modelName,
          messages: [
            {
              role: 'system',
              content: `You are an emotional tone analyzer for message drafts.
Analyze the user draft for emotional state and return ONLY a valid JSON object matching this schema:
{
  "state": "frustrated" | "overwhelmed" | "rushed" | "uncertain" | "distressed" | "neutral",
  "confidence": number between 0.0 and 1.0,
  "signals": array of short detected signal strings
}
Safety rule: If the user expresses acute crisis, self-harm, or hopelessness, state MUST be "distressed".
Sarcasm rule: If sarcasm or passive-aggression is detected, heavily penalize confidence below 0.5.`,
            },
            {
              role: 'user',
              content: draft,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
          max_tokens: 150,
        }),
      });

      if (!response.ok) {
        // Fall back gracefully on HTTP failure
        return this.fallbackAnalyzer.analyze(draft);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content) {
        return this.fallbackAnalyzer.analyze(draft);
      }

      const parsed = JSON.parse(content);
      const validStates: EmotionalState[] = [
        'frustrated',
        'overwhelmed',
        'rushed',
        'uncertain',
        'distressed',
        'neutral',
      ];

      const state: EmotionalState = validStates.includes(parsed.state) ? parsed.state : 'neutral';
      const confidence =
        typeof parsed.confidence === 'number' ? Math.max(0, Math.min(1, parsed.confidence)) : 0.5;
      const signals = Array.isArray(parsed.signals) ? parsed.signals : ['llm_analysis'];

      return {
        state,
        confidence: Number(confidence.toFixed(2)),
        signals,
      };
    } catch {
      // In case of network errors or timeouts, fall back safely
      return this.fallbackAnalyzer.analyze(draft);
    }
  }
}
