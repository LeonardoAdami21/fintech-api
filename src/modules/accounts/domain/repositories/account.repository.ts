// src/modules/accounts/domain/repositories/account.repository.ts
import { Account } from '../entities/account.entity';

export const ACCOUNT_REPOSITORY = Symbol('IAccountRepository');

export interface IAccountRepository {
  findById(id: string): Promise<Account | null>;
  findByUserId(userId: string): Promise<Account | null>;
  findByPixKey(keyValue: string): Promise<Account | null>;
  save(account: Account): Promise<void>;
  update(account: Account): Promise<void>;
  delete(account: Account): Promise<void>;
}
