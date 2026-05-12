// src/modules/fraud/domain/repositories/fraud-analysis.repository.ts
import { FraudAnalysis } from '../entities/fraud-analysis.entity';

export const FRAUD_ANALYSIS_REPOSITORY = Symbol('IFraudAnalysisRepository');

export interface IFraudAnalysisRepository {
  save(analysis: FraudAnalysis): Promise<void>;
  countRecentBySender(senderAccountId: string, sinceMinutes: number): Promise<number>;
  sumRecentAmountBySender(senderAccountId: string, sinceHours: number): Promise<bigint>;
  findRecentReceivers(senderAccountId: string, sinceHours: number): Promise<string[]>;
}
