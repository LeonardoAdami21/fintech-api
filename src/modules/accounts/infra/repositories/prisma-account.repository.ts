// src/modules/accounts/infrastructure/repositories/prisma-account.repository.ts
import { Injectable } from '@nestjs/common';
import { IAccountRepository } from '../../domain/repositories/account.repository';
import { Account } from '../../domain/entities/account.entity';
import { AccountMapper } from '../mappers/account.mapper';
import { PrismaService } from 'src/shared/infra/prisma.service';

const includeKeys = { pixKeys: true } as const;

@Injectable()
export class PrismaAccountRepository implements IAccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Account | null> {
    const raw = await this.prisma.account.findUnique({
      where: { id },
      include: includeKeys,
    });
    return raw ? AccountMapper.toDomain(raw) : null;
  }

  async findByUserId(userId: string): Promise<Account | null> {
    const raw = await this.prisma.account.findUnique({
      where: { userId },
      include: includeKeys,
    });
    return raw ? AccountMapper.toDomain(raw) : null;
  }

  async findByPixKey(keyValue: string): Promise<Account | null> {
    const pixKey = await this.prisma.pixKey.findUnique({
      where: { keyValue },
      include: { account: { include: includeKeys } },
    });
    return pixKey ? AccountMapper.toDomain(pixKey.account as any) : null;
  }

  async save(account: Account): Promise<void> {
    const data = AccountMapper.toPersistence(account);
    await this.prisma.account.create({ data });
  }

  async update(account: Account): Promise<void> {
    const { id, ...data } = AccountMapper.toPersistence(account);
    await this.prisma.$transaction([
      this.prisma.account.update({ where: { id }, data }),
      // Sync PIX keys: delete removed, upsert existing
      ...account.pixKeys.map((pk) =>
        this.prisma.pixKey.upsert({
          where: { keyValue: pk.value },
          update: {},
          create: { accountId: id, keyType: pk.type, keyValue: pk.value },
        }),
      ),
    ]);
  }

  async delete(account: Account): Promise<void> {
    await this.prisma.account.delete({ where: { id: account.id } });
  }
}
