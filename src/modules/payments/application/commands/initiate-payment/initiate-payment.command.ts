// src/modules/payments/application/commands/initiate-payment/initiate-payment.command.ts
import { PaymentType } from '../../../domain/entities/payment.entity';

export class InitiatePaymentCommand {
  constructor(
    readonly senderUserId: string, // resolved by auth
    readonly receiverPixKey: string, // PIX key to look up receiver
    readonly amountBRL: number,
    readonly type: PaymentType,
    readonly description?: string,
    readonly idempotencyKey?: string,
  ) {}
}
