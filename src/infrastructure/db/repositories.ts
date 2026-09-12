export interface DecisionRepository {
  findById(id: string): Promise<unknown | null>;
  save(decision: unknown): Promise<void>;
  delete(id: string): Promise<void>;
}

export class PrismaDecisionRepository implements DecisionRepository {
  async findById(_id: string): Promise<unknown | null> {
    return null;
  }

  async save(_decision: unknown): Promise<void> {}

  async delete(_id: string): Promise<void> {}
}
