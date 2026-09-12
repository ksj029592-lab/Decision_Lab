export type DecisionStatus = 'draft' | 'analyzing' | 'comparing' | 'decided' | 'archived';
export type SourceType = 'user' | 'ai';
export type CriterionDirection = 'higher_is_better' | 'lower_is_better';
export type StabilityLevel = 'high' | 'medium' | 'low' | 'unavailable';

export interface DecisionAggregate {
  id: string;
  userId: string;
  title: string;
  problemStatement: string;
  summary?: string;
  status: DecisionStatus;
  selectedOptionId?: string;
  createdAt: Date;
  updatedAt: Date;
  decidedAt?: Date;
  archivedAt?: Date;
}
