// src/modules/identity/infrastructure/services/token.service.ts
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string; // opaque random token (plain, sent to client)
  refreshTokenHash: string; // bcrypt hash (stored in DB)
  accessExpiresIn: number; // seconds
  refreshExpiresAt: Date;
}

@Injectable()
export class TokenService {
  private static readonly ACCESS_TTL_SECONDS = 15 * 60; // 15 min
  private static readonly REFRESH_TTL_DAYS = 7;
  private static readonly BCRYPT_ROUNDS = 10;

  constructor(private readonly jwtService: JwtService) {}

  async issueTokenPair(payload: AccessTokenPayload): Promise<TokenPair> {
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: TokenService.ACCESS_TTL_SECONDS,
    });

    // Opaque refresh token — 48 random bytes → base64url string
    const rawRefresh = randomBytes(48).toString('base64url');
    const refreshHash = await bcrypt.hash(
      rawRefresh,
      TokenService.BCRYPT_ROUNDS,
    );
    const refreshExpiresAt = new Date(
      Date.now() + TokenService.REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
    );

    return {
      accessToken,
      refreshToken: rawRefresh,
      refreshTokenHash: refreshHash,
      accessExpiresIn: TokenService.ACCESS_TTL_SECONDS,
      refreshExpiresAt,
    };
  }

  /** Compare a plain refresh token against a stored bcrypt hash */
  async verifyRefreshToken(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }

  decodeAccessToken(token: string): AccessTokenPayload {
    return this.jwtService.verify<AccessTokenPayload>(token);
  }

  get refreshTtlDays(): number {
    return TokenService.REFRESH_TTL_DAYS;
  }
}
