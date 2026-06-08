// src/modules/payments/application/commands/initiate-payment/initiate-payment.handler.ts
import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';

import { InitiatePaymentCommand } from './initiate-payment.command';
import * as paymentRepository from 'src/modules/payments/domain/repositories/payment.repository';
import * as accountRepository from 'src/modules/accounts/domain/repositories/account.repository';
import { PrismaService } from 'src/shared/infrastructure/prisma.service';
import { OutboxService } from 'src/shared/infrastructure/outbox/outbox.service';
import {
  AnalyzePaymentCommand,
  AnalyzePaymentHandler,
} from 'src/modules/fraud/application/commands/analyze-payment/analyze-payment.handler';
import { IdempotencyKey } from 'src/modules/payments/domain/value-objects/idempotency-key.vo';
import { Money } from 'src/shared/domain/money.vo';
import { Payment } from 'src/modules/payments/domain/entities/payment.entity';

export interface InitiatePaymentResult {
  paymentId: string;
  status: string;
  amountBRL: number;
  idempotencyKey: string;
  fraudAnalysis: {
    analysisId: string;
    riskScore: number;
    decision: string;
    factors: Array<{ code: string; description: string; weight: number }>;
  };
}

@Injectable()
export class InitiatePaymentHandler {
  private readonly logger = new Logger(InitiatePaymentHandler.name);

  constructor(
    @Inject(paymentRepository.PAYMENT_REPOSITORY)
    private readonly paymentRepo: paymentRepository.IPaymentRepository,
    @Inject(accountRepository.ACCOUNT_REPOSITORY)
    private readonly accountRepo: accountRepository.IAccountRepository,
    private readonly prisma: PrismaService,
    private readonly outboxService: OutboxService,
    private readonly fraudAnalyzer: AnalyzePaymentHandler,
  ) {}

  async execute(
    command: InitiatePaymentCommand,
  ): Promise<InitiatePaymentResult> {
    // ── 1. Idempotency guard ────────────────────────────────────────────────
    const keyResult = command.idempotencyKey
      ? IdempotencyKey.create(command.idempotencyKey)
      : (() => {
          const k = IdempotencyKey.generate();
          return {
            isFailure: false as const,
            isSuccess: true as const,
            value: k,
          };
        })();

    if (keyResult.isFailure)
      throw new BadRequestException((keyResult as any).error.message);
    const idempotencyKey = (keyResult as any).value as IdempotencyKey;

    const existing = await this.paymentRepo.findByIdempotencyKey(
      idempotencyKey.value,
    );
    if (existing) {
      this.logger.log('Idempotent replay — key ' + idempotencyKey.value);
      return {
        paymentId: existing.id,
        status: existing.status,
        amountBRL: existing.amount.amountBRL,
        idempotencyKey: existing.idempotencyKey.value,
        fraudAnalysis: {
          analysisId: 'cached',
          riskScore: 0,
          decision: 'APPROVED',
          factors: [],
        },
      };
    }

    // ── 2. Resolve accounts ─────────────────────────────────────────────────
    const senderAccount = await this.accountRepo.findByUserId(
      command.senderUserId,
    );
    if (!senderAccount) throw new NotFoundException('Sender account not found');

    const receiverAccount = await this.accountRepo.findByPixKey(
      command.receiverPixKey,
    );
    if (!receiverAccount)
      throw new NotFoundException('Receiver PIX key not found');

    if (senderAccount.id === receiverAccount.id) {
      throw new BadRequestException('Cannot transfer to yourself');
    }

    // ── 3. Build Money ──────────────────────────────────────────────────────
    const amountResult = Money.fromBRL(command.amountBRL);
    if (amountResult.isFailure)
      throw new BadRequestException(amountResult.error.message);
    const amount = amountResult.value;

    // ── 4. Fraud analysis BEFORE touching balances ──────────────────────────
    const accountAgeDays = Math.floor(
      (Date.now() - senderAccount.createdAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    const fraudResult = await this.fraudAnalyzer.execute(
      new AnalyzePaymentCommand(
        undefined, // paymentId not yet created
        senderAccount.id,
        receiverAccount.id,
        +amount.amountCents,
        accountAgeDays,
      ),
    );

    if (fraudResult.decision === 'BLOCKED') {
      this.logger.warn(
        'Payment BLOCKED by fraud — score=' +
          fraudResult.riskScore +
          ' factors=' +
          fraudResult.factors.map((f: any) => f.code).join(','),
      );
      throw new ForbiddenException({
        message: 'Payment blocked by fraud analysis',
        riskScore: fraudResult.riskScore,
        factors: fraudResult.factors,
      });
    }

    if (fraudResult.decision === 'REVIEW') {
      this.logger.warn(
        'Payment flagged for REVIEW — score=' + fraudResult.riskScore,
      );
      // In production: queue for manual review, return 202 Accepted
    }

    // ── 5. Create Payment aggregate ─────────────────────────────────────────
    const paymentResult = Payment.initiate({
      senderAccountId: senderAccount.id,
      receiverAccountId: receiverAccount.id,
      amount,
      type: command.type,
      description: command.description,
      idempotencyKey,
    });
    if (paymentResult.isFailure)
      throw new BadRequestException(paymentResult.error.message);
    const payment = paymentResult.value;

    // ── 6. Saga — atomic DB transaction ────────────────────────────────────
    try {
      await this.prisma.$transaction(async (tx) => {
        // 6a. Persist payment as PROCESSING
        await tx.payment.create({
          data: {
            id: payment.id,
            senderAccountId: senderAccount.id,
            receiverAccountId: receiverAccount.id,
            amountCents: amount.amountCents,
            type: command.type,
            status: 'PROCESSING',
            description: command.description ?? null,
            idempotencyKey: idempotencyKey.value,
            failureReason: null,
            processedAt: null,
          },
        });

        // 6b. Update fraud analysis with paymentId
        await tx.fraudAnalysis.update({
          where: { id: fraudResult.analysisId },
          data: { paymentId: payment.id },
        });

        // 6c. Debit sender
        const debitResult = senderAccount.debit(amount);
        if (debitResult.isFailure) throw new Error(debitResult.error.message);
        await tx.account.update({
          where: { id: senderAccount.id },
          data: { balanceCents: senderAccount.balance.amountCents },
        });

        // 6d. Credit receiver
        const creditResult = receiverAccount.credit(amount);
        if (creditResult.isFailure) throw new Error(creditResult.error.message);
        await tx.account.update({
          where: { id: receiverAccount.id },
          data: { balanceCents: receiverAccount.balance.amountCents },
        });

        // 6e. Double-entry ledger
        await tx.ledgerEntry.createMany({
          data: [
            {
              paymentId: payment.id,
              accountId: senderAccount.id,
              type: 'DEBIT',
              amountCents: amount.amountCents,
              balanceCents: senderAccount.balance.amountCents,
              description: command.type + ' sent to ' + command.receiverPixKey,
            },
            {
              paymentId: payment.id,
              accountId: receiverAccount.id,
              type: 'CREDIT',
              amountCents: amount.amountCents,
              balanceCents: receiverAccount.balance.amountCents,
              description:
                command.type +
                ' received from account ' +
                senderAccount.accountNumber.value,
            },
          ],
        });

        // 6f. Complete payment
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: 'COMPLETED', processedAt: new Date() },
        });

        // 6g. Persist domain events in outbox (same transaction — atomicity guaranteed)
        payment.complete();
        const domainEvents = payment.domainEvents;
        await Promise.all(
          this.outboxService.buildOutboxInserts(domainEvents, tx),
        );
      });

      this.logger.log('Payment ' + payment.id + ' completed');
    } catch (err: any) {
      // ── Compensation: mark FAILED ─────────────────────────────────────────
      this.logger.error('Payment saga failed: ' + err.message);
      await this.prisma.payment
        .updateMany({
          where: { id: payment.id, status: { in: ['PENDING', 'PROCESSING'] } },
          data: { status: 'FAILED', failureReason: err.message },
        })
        .catch(() => {
          /* might not be persisted yet */
        });

      throw new BadRequestException(err.message ?? 'Payment processing failed');
    }

    payment.clearDomainEvents();

    return {
      paymentId: payment.id,
      status: 'COMPLETED',
      amountBRL: amount.amountBRL,
      idempotencyKey: idempotencyKey.value,
      fraudAnalysis: fraudResult,
    };
  }
}
