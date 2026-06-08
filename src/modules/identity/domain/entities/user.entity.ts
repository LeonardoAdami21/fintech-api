// src/modules/identity/domain/entities/user.entity.ts

import { Email } from '../value-objects/email.vo';
import { Password } from '../value-objects/password.vo';
import { UserCreatedEvent } from '../events/user-created.event';
import { UserSuspendedEvent } from '../events/user-suspended.event';
import { AggregateRoot } from 'src/shared/domain/aggregate-root';
import { DomainError, Result } from 'src/shared/domain/result';

export type UserRole = 'CUSTOMER' | 'ADMIN';
export type UserStatus =
  | 'PENDING_VERIFICATION'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'CLOSED';

interface UserProps {
  email: Email;
  password: Password;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class User extends AggregateRoot<UserProps> {
  private constructor(props: UserProps, id?: string) {
    super(props, id);
  }

  // ── Getters ──────────────────────────────────────
  get email(): Email {
    return this.props.email;
  }
  get password(): Password {
    return this.props.password;
  }
  get role(): UserRole {
    return this.props.role;
  }
  get status(): UserStatus {
    return this.props.status;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get isActive(): boolean {
    return this.props.status === 'ACTIVE';
  }

  // ── Factory: new user ─────────────────────────────
  static create(
    props: { email: Email; password: Password },
    role: UserRole = 'CUSTOMER',
  ): Result<User, DomainError> {
    const now = new Date();
    const user = new User({
      email: props.email,
      password: props.password,
      role,
      status: 'PENDING_VERIFICATION',
      createdAt: now,
      updatedAt: now,
    });
    user.addDomainEvent(new UserCreatedEvent(user.id, props.email.value));
    return Result.ok(user);
  }

  // ── Factory: reconstitution from persistence ──────
  static  reconstitute(props: UserProps, id: string): User {
    return new User(props, id);
  }

  // ── Business methods ──────────────────────────────
  activate(): Result<void, DomainError> {
    if (this.props.status === 'ACTIVE') {
      return Result.fail({
        code: 'ALREADY_ACTIVE',
        message: 'Usuario ja ativado',
      });
    }
    this.props.status = 'ACTIVE';
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  suspend(reason: string): Result<void, DomainError> {
    if (this.props.status === 'SUSPENDED') {
      return Result.fail({
        code: 'ALREADY_SUSPENDED',
        message: 'User ja suspenso',
      });
    }
    this.props.status = 'SUSPENDED';
    this.props.updatedAt = new Date();
    this.addDomainEvent(new UserSuspendedEvent(this.id, reason));
    return Result.ok(undefined);
  }

  async changePassword(
    newPassword: Password,
  ): Promise<Result<void, DomainError>> {
    if (!this.isActive) {
      return Result.fail({
        code: 'INACTIVE_USER',
        message: 'Apenas usuarios ativos podem alterar a senha',
      });
    }
    const hashed = await newPassword.hash();
    (this.props as UserProps).password = hashed;
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }
}
