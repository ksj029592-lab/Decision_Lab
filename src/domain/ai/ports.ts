export interface ProblemAnalysisInput {
  title: string;
  problemStatement: string;
  initialOptions?: string[];
}

export interface ProblemAnalysisOutput {
  summary: string;
  suggestedOptions: Array<{ name: string; description?: string }>;
  suggestedCriteria: Array<{ name: string; description?: string; importance: number }>;
  followUpQuestions?: string[];
}

export interface AiProvider {
  analyzeProblem(input: ProblemAnalysisInput): Promise<ProblemAnalysisOutput>;
  suggestOptions(input: unknown): Promise<unknown>;
  suggestCriteria(input: unknown): Promise<unknown>;
  evaluateOptions(input: unknown): Promise<unknown>;
  explainDecision(input: unknown): Promise<unknown>;
}
