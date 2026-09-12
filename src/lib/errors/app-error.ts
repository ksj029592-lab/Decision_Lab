export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'DOMAIN_RULE_VIOLATION'
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'AI_PROVIDER_ERROR'
  | 'FOUNDRY_AUTH_ERROR'
  | 'FOUNDRY_ROUTER_ERROR'
  | 'AI_SCHEMA_ERROR'
  | 'PERSISTENCE_ERROR'
  | 'RATE_LIMITED';

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly statusCode: number = 400,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}
