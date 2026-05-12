// src/modules/accounts/application/queries/get-statement.query.ts
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import * as accountRepository from '../../domain/repositories/account.repository';
import { PrismaService } from 'src/shared/infrastructure/prisma.service';

export interface StatementFilter {
  page: number;
  limit: number;
  from?: Date;
  to?: Date;
}

@Injectable()
export class GetStatementQuery {
  constructor(
    @Inject(accountRepository.ACCOUNT_REPOSITORY)
    private readonly accountRepo: accountRepository.IAccountRepository,
    private readonly prisma: PrismaService,
  ) {}

  async byUserId(userId: string, filter: StatementFilter) {
    const account = await this.accountRepo.findByUserId(userId);
    if (!account) throw new NotFoundException('Account not found');

    const { page, limit, from, to } = filter;
    const skip = (page - 1) * limit;
    const take = Math.min(limit, 100);

    const where: any = { accountId: account.id };
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = from;
      if (to) where.createdAt.lte = to;
    }

    const [entries, total] = await Promise.all([
      this.prisma.ledgerEntry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          payment: {
            select: {
              type: true,
              description: true,
              senderAccountId: true,
              receiverAccountId: true,
            },
          },
        },
      }),
      this.prisma.ledgerEntry.count({ where }),
    ]);

    return {
      accountId: account.id,
      accountNumber: account.accountNumber.value,
      currentBalance: account.balance.amountBRL,
      pagination: {
        page,
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
        hasNext: page * take < total,
        hasPrev: page > 1,
      },
      entries: entries.map((e) => ({
        entryId: e.id,
        type: e.type, // DEBIT | CREDIT
        amountBRL: Number(e.amountCents) / 100,
        balanceBRL: Number(e.balanceCents) / 100,
        description: e.description,
        paymentType: e.payment?.type ?? null,
        paymentDesc: e.payment?.description ?? null,
        counterpartAccountId:
          e.type === 'DEBIT'
            ? (e.payment?.receiverAccountId ?? null)
            : (e.payment?.senderAccountId ?? null),
        createdAt: e.createdAt,
      })),
    };
  }
}
