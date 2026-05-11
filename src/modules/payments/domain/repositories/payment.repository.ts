// src/modules/payments/domain/repositories/payment.repository.ts
import { Payment } from '../entities/payment.entity';

export const PAYMENT_REPOSITORY = Symbol('IPaymentRepository');

export interface IPaymentRepository {
  findById(id: string): Promise<Payment | null>;
  findByIdempotencyKey(key: string): Promise<Payment | null>;
  findBySenderAccountId(accountId: string, limit?: number): Promise<Payment[]>;
  save(payment: Payment): Promise<void>;
  update(payment: Payment): Promise<void>;
}
