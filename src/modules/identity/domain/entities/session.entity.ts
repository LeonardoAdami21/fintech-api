import { Entity } from 'src/shared/domain/entity.base';
import { DomainError, Result } from 'src/shared/domain/result';

interface SessionProps {
  userId: string;
  refreshToken: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}

export class Session extends Entity<SessionProps> {
  private constructor(props: SessionProps, id?: string) {
    super(props, id);
  }

  get userId(): string {
    return this.props.userId;
  }
  get refreshToken(): string {
    return this.props.refreshToken;
  }
  get expiresAt(): Date {
    return this.props.expiresAt;
  }
  get revokedAt(): Date | null {
    return this.props.revokedAt;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }

  get isExpired(): boolean {
    return new Date() > this.props.expiresAt;
  }
  get isRevoked(): boolean {
    return this.props.revokedAt !== null;
  }
  get isValid(): boolean {
    return !this.isExpired && !this.isRevoked;
  }

  static create(props: {
    userId: string;
    refreshToken: string;
    ttlDays?: number;
  }): Result<Session, DomainError> {
    const ttl = props.ttlDays ?? 7;
    const expiresAt = new Date(Date.now() + ttl * 24 * 60 * 60 * 1000);
    return Result.ok(
      new Session({
        userId: props.userId,
        refreshToken: props.refreshToken,
        expiresAt,
        revokedAt: null,
        createdAt: new Date(),
      }),
    );
  }

  static reconstitute(props: SessionProps, id: string): Session {
    return new Session(props, id);
  }

  revoke(): Result<void, DomainError> {
    if (this.isRevoked) {
      return Result.fail({
        code: 'ALREADY_REVOKED',
        message: 'A sessão ja foi revogada',
      });
    }
    this.props.revokedAt = new Date();
    return Result.ok(undefined);
  }
}
