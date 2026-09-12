import type { AiProvider, ProblemAnalysisInput, ProblemAnalysisOutput } from '@/domain/ai/ports';

export interface FoundryModelRouterConfig {
  projectEndpoint: string;
  routerDeploymentName: string;
  apiVersion?: string;
  requestTimeoutMs: number;
}

export class FoundryModelRouterProvider implements AiProvider {
  constructor(private config: FoundryModelRouterConfig) {}

  async analyzeProblem(_input: ProblemAnalysisInput): Promise<ProblemAnalysisOutput> {
    // Stub implementation using Azure Foundry Model Router SDK / REST API
    throw new Error('Method not implemented.');
  }

  async suggestOptions(_input: unknown): Promise<unknown> {
    throw new Error('Method not implemented.');
  }

  async suggestCriteria(_input: unknown): Promise<unknown> {
    throw new Error('Method not implemented.');
  }

  async evaluateOptions(_input: unknown): Promise<unknown> {
    throw new Error('Method not implemented.');
  }

  async explainDecision(_input: unknown): Promise<unknown> {
    throw new Error('Method not implemented.');
  }
}
