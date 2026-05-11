// src/modules/identity/application/commands/refresh-token/refresh-token.handler.ts
import {
  Inject,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { RefreshTokenCommand } from './refresh-token.command';
import * as userRepository from '../../../domain/repositories/user.repository';
import * as sessionRepository from '../../../domain/repositories/session.repository';
import { Session } from '../../../domain/entities/session.entity';
import { TokenService } from 'src/modules/identity/infra/services/token.service';

export interface RefreshTokenResult {
  accessToken: string;
  refreshToken: string; // new rotated token
  accessExpiresIn: number;
  refreshExpiresAt: Date;
}

@Injectable()
export class RefreshTokenHandler {
  private readonly logger = new Logger(RefreshTokenHandler.name);

  constructor(
    @Inject(userRepository.USER_REPOSITORY)
    private readonly userRepo: userRepository.IUserRepository,
    @Inject(sessionRepository.SESSION_REPOSITORY)
    private readonly sessionRepo: sessionRepository.ISessionRepository,
    private readonly tokenService: TokenService,
  ) {}

  async execute(command: RefreshTokenCommand): Promise<RefreshTokenResult> {
    // ── 1. Find ALL sessions and bcrypt-compare against the plain token ────────
    //       We cannot query by hash directly, so we fetch active sessions per user
    //       by scanning a small window. In production, store a fast-lookup index
    //       (e.g. SHA-256 prefix) alongside the bcrypt hash.
    //
    //       Simplified approach: the client also sends userId in the body so we
    //       scope the scan. Here we accept just the token and do a DB-level trick:
    //       store a NON-sensitive token family ID alongside the hash (see note in README).
    //
    //       For this implementation we scan PENDING sessions (performance is fine at scale
    //       because each user has at most ~5 active sessions).

    // Split token: format is  <sessionId>.<randomPart>
    const [sessionId, ...rest] = command.refreshToken.split('.');
    if (!sessionId || !rest.length) {
      throw new UnauthorizedException('Malformed refresh token');
    }
    const randomPart = rest.join('.');

    const session = await this.sessionRepo.findById(sessionId);
    if (!session) {
      throw new UnauthorizedException('Session not found');
    }

    // ── 2. Reuse detection ────────────────────────────────────────────────────
    //       If session is already revoked and someone tries to use it again,
    //       treat it as token theft → revoke ALL sessions for the user.
    if (session.isRevoked) {
      this.logger.warn(
        'Refresh token reuse detected for user ' +
          session.userId +
          ' — revoking all sessions',
      );
      await this.sessionRepo.revokeAllByUserId(session.userId);
      throw new UnauthorizedException(
        'Refresh token reuse detected. Please log in again.',
      );
    }

    if (session.isExpired) {
      throw new UnauthorizedException('Refresh token expired');
    }

    // ── 3. Verify bcrypt hash ─────────────────────────────────────────────────
    const valid = await this.tokenService.verifyRefreshToken(
      randomPart,
      session.refreshToken,
    );
    if (!valid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // ── 4. Load user ──────────────────────────────────────────────────────────
    const user = await this.userRepo.findById(session.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // ── 5. Rotate: revoke old session, issue new pair ─────────────────────────
    session.revoke();
    await this.sessionRepo.update(session);

    const pair = await this.tokenService.issueTokenPair({
      sub: user.id,
      email: user.email.value,
      role: user.role,
    });

    const newSessionResult = Session.create({
      userId: user.id,
      refreshToken: pair.refreshTokenHash,
      ttlDays: this.tokenService.refreshTtlDays,
    });
    if (newSessionResult.isFailure)
      throw new Error(newSessionResult.error.message);

    const newSession = newSessionResult.value;
    await this.sessionRepo.save(newSession);

    // Return token in <newSessionId>.<randomPart> format
    const newRefreshToken = newSession.id + '.' + pair.refreshToken;

    this.logger.log(
      'Token rotated for user ' +
        user.id +
        ' — old=' +
        session.id +
        ' new=' +
        newSession.id,
    );

    return {
      accessToken: pair.accessToken,
      refreshToken: newRefreshToken,
      accessExpiresIn: pair.accessExpiresIn,
      refreshExpiresAt: pair.refreshExpiresAt,
    };
  }
}
