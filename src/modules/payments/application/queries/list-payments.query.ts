// src/modules/payments/application/queries/list-payments.query.ts
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import * as paymentRepository from '../../domain/repositories/payment.repository';
import * as accountRepository from 'src/modules/accounts/domain/repositories/account.repository';

@Injectable()
export class ListPaymentsQuery {
  constructor(
    @Inject(paymentRepository.PAYMENT_REPOSITORY)
    private readonly paymentRepo: paymentRepository.IPaymentRepository,
    @Inject(accountRepository.ACCOUNT_REPOSITORY)
    private readonly accountRepo: accountRepository.IAccountRepository,
  ) {}

  async byUserId(userId: string, limit = 20) {
    const account = await this.accountRepo.findByUserId(userId);
    if (!account) throw new NotFoundException('Account not found');

    const payments = await this.paymentRepo.findBySenderAccountId(
      account.id,
      limit,
    );

    return payments.map((p) => ({
      paymentId: p.id,
      type: p.type,
      status: p.status,
      amountBRL: p.amount.amountBRL,
      description: p.description,
      processedAt: p.processedAt,
      createdAt: p.createdAt,
      senderAccountId: p.senderAccountId,
      receiverAccountId: p.receiverAccountId,
    }));
  }
}
