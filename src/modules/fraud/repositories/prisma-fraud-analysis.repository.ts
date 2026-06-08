// src/modules/fraud/infrastructure/repositories/prisma-fraud-analysis.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/infrastructure/prisma.service';
import { FraudAnalysis } from '../domain/entities/fraud-analysis.entity';
import { IFraudAnalysisRepository } from '../domain/repositories/fraud-analysis.repository';

@Injectable()
export class PrismaFraudAnalysisRepository implements IFraudAnalysisRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(analysis: FraudAnalysis): Promise<void> {
    await this.prisma.fraudAnalysis.create({
      data: {
        id: analysis.id,
        paymentId: analysis.paymentId ?? null,
        senderAccountId: analysis.senderAccountId,
        amountCents: analysis.amountCents,
        riskScore: analysis.riskScore.value,
        decision: analysis.decision,
        factors: analysis.factors.map((f) => f.toJSON()) as any,
        analyzedAt: analysis.analyzedAt,
      },
    });
  }

  async countRecentBySender(
    senderAccountId: string,
    sinceMinutes: number,
  ): Promise<number> {
    const since = new Date(Date.now() - sinceMinutes * 60 * 1000);
    return this.prisma.fraudAnalysis.count({
      where: { senderAccountId, analyzedAt: { gte: since } },
    });
  }

  async sumRecentAmountBySender(
    senderAccountId: string,
    sinceHours: number,
  ): Promise<number> {
    const since = new Date(Date.now() - sinceHours * 60 * 60 * 1000);
    const result = await this.prisma.fraudAnalysis.aggregate({
      where: {
        senderAccountId,
        decision: { not: 'BLOCKED' },
        analyzedAt: { gte: since },
      },
      _sum: { amountCents: true },
    });
    return result._sum.amountCents ?? 0;
  }

  async findRecentReceivers(
    senderAccountId: string,
    sinceHours: number,
  ): Promise<string[]> {
    const since = new Date(Date.now() - sinceHours * 60 * 60 * 1000);
    // Join with payments to get receiver ids — simplified via raw query
    const rows = await this.prisma.$queryRaw<{ receiver_account_id: string }[]>`
      SELECT DISTINCT p.receiver_account_id
      FROM fraud_analyses fa
      JOIN payments p ON p.id = fa.payment_id
      WHERE fa.sender_account_id = ${senderAccountId}
        AND fa.analyzed_at >= ${since}
    `;
    return rows.map((r) => r.receiver_account_id);
  }
}
