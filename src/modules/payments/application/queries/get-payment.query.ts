// src/modules/payments/application/queries/get-payment.query.ts
import {
  Inject,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import * as paymentRepository from '../../domain/repositories/payment.repository';
import * as accountRepository from 'src/modules/accounts/domain/repositories/account.repository';

@Injectable()
export class GetPaymentQuery {
  constructor(
    @Inject(paymentRepository.PAYMENT_REPOSITORY)
    private readonly paymentRepo: paymentRepository.IPaymentRepository,
    @Inject(accountRepository.ACCOUNT_REPOSITORY)
    private readonly accountRepo: accountRepository.IAccountRepository,
  ) {}

  async byId(paymentId: string, requestingUserId: string) {
    const payment = await this.paymentRepo.findById(paymentId);
    if (!payment) throw new NotFoundException('Payment not found');

    // Ensure requester owns sender or receiver account
    const account = await this.accountRepo.findByUserId(requestingUserId);
    if (!account) throw new NotFoundException('Account not found');

    const isParty =
      payment.senderAccountId === account.id ||
      payment.receiverAccountId === account.id;

    if (!isParty) {
      throw new ForbiddenException('You are not a party to this payment');
    }

    return {
      paymentId: payment.id,
      type: payment.type,
      status: payment.status,
      amountBRL: payment.amount.amountBRL,
      amountCents: payment.amount.amountCents.toString(),
      description: payment.description,
      idempotencyKey: payment.idempotencyKey.value,
      failureReason: payment.failureReason,
      senderAccountId: payment.senderAccountId,
      receiverAccountId: payment.receiverAccountId,
      direction:
        payment.senderAccountId === account.id ? 'OUTGOING' : 'INCOMING',
      processedAt: payment.processedAt,
      createdAt: payment.createdAt,
    };
  }
}
