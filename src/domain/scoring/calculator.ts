export type ScoreInput = {
  criteria: Array<{
    id: string;
    importance: number; // 1..5
  }>;
  options: Array<{
    id: string;
    evaluations: Array<{
      criterionId: string;
      score: number; // 0..100
    }>;
  }>;
};

export type ScoreResult = {
  options: Array<{
    optionId: string;
    totalScore: number;
    rank: number | null;
    contributions: Array<{
      criterionId: string;
      weightedScore: number;
    }>;
  }>;
  scoreGap: number | null;
  stabilityLevel: 'high' | 'medium' | 'low' | 'unavailable';
  tie: boolean;
};

export function calculateScores(_input: ScoreInput): ScoreResult {
  // Pure domain function stub to be implemented
  return {
    options: [],
    scoreGap: null,
    stabilityLevel: 'unavailable',
    tie: false,
  };
}
