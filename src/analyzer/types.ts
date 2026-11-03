export type EmotionalState =
  'frustrated' | 'overwhelmed' | 'rushed' | 'uncertain' | 'distressed' | 'neutral';

export interface AnalysisResult {
  state: EmotionalState;
  confidence: number;
  signals: string[];
}

export interface Analyzer {
  analyze(draft: string): Promise<AnalysisResult>;
}
