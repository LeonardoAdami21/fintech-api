// src/modules/payments/infrastructure/repositories/prisma-payment.repository.ts
import { Injectable } from '@nestjs/common';
import { IPaymentRepository } from '../../domain/repositories/payment.repository';
import { Payment } from '../../domain/entities/payment.entity';
import { PaymentMapper } from '../mappers/payment.mapper';
import { PrismaService } from 'src/shared/infra/prisma.service';

@Injectable()
export class PrismaPaymentRepository implements IPaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Payment | null> {
    const raw = await this.prisma.payment.findUnique({ where: { id } });
    return raw ? PaymentMapper.toDomain(raw) : null;
  }

  async findByIdempotencyKey(key: string): Promise<Payment | null> {
    const raw = await this.prisma.payment.findUnique({
      where: { idempotencyKey: key },
    });
    return raw ? PaymentMapper.toDomain(raw) : null;
  }

  async findBySenderAccountId(
    accountId: string,
    limit = 20,
  ): Promise<Payment[]> {
    const rows = await this.prisma.payment.findMany({
      where: { senderAccountId: accountId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.map(PaymentMapper.toDomain);
  }

  async save(payment: Payment): Promise<void> {
    await this.prisma.payment.create({
      data: PaymentMapper.toPersistence(payment),
    });
  }

  async update(payment: Payment): Promise<void> {
    const { id, ...data } = PaymentMapper.toPersistence(payment);
    await this.prisma.payment.update({ where: { id }, data });
  }
}
