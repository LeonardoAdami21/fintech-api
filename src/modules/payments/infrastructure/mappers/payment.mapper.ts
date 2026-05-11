// src/modules/payments/infrastructure/mappers/payment.mapper.ts
import { Payment as PrismaPayment } from '@prisma/client';
import { Payment } from '../../domain/entities/payment.entity';
import { IdempotencyKey } from '../../domain/value-objects/idempotency-key.vo';

function makeMoney(cents: bigint) {
  return {
    amountCents: cents,
    currency: 'BRL',
    amountBRL: Number(cents) / 100,
    add: () => {},
    subtract: () => {},
    isGreaterThan: () => false,
  } as any;
}

export class PaymentMapper {
  static toDomain(raw: PrismaPayment): Payment {
    const idempotencyKey = IdempotencyKey.create(raw.idempotencyKey);
    if (idempotencyKey.isFailure) throw new Error('Bad idempotency key in DB');

    return Payment.reconstitute(
      {
        senderAccountId: raw.senderAccountId,
        receiverAccountId: raw.receiverAccountId,
        amount: makeMoney(raw.amountCents),
        type: raw.type as any,
        status: raw.status as any,
        description: raw.description,
        idempotencyKey: idempotencyKey.value,
        failureReason: raw.failureReason,
        processedAt: raw.processedAt,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      raw.id,
    );
  }

  static toPersistence(payment: Payment) {
    return {
      id: payment.id,
      senderAccountId: payment.senderAccountId,
      receiverAccountId: payment.receiverAccountId,
      amountCents: payment.amount.amountCents,
      type: payment.type,
      status: payment.status,
      description: payment.description,
      idempotencyKey: payment.idempotencyKey.value,
      failureReason: payment.failureReason,
      processedAt: payment.processedAt,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }
}
